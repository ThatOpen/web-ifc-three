import {
    PlacedGeometry,
    IfcGeometry,
    IFCSPACE,
    FlatMesh,
    IFCOPENINGELEMENT,
    IFCPRODUCTDEFINITIONSHAPE,
    IFCFURNISHINGELEMENT,
    IFCWINDOW,
    IFCDOOR,
} from 'web-ifc';
import {IfcState, IfcMesh} from '../BaseDefinitions';
import {
    Color,
    MeshLambertMaterial,
    Matrix4,
    BufferGeometry,
    BufferAttribute,
} from 'three';
import {BvhManager} from './BvhManager';
import {GeometryUtils} from 'bim-fragment/geometry-utils';
import {Fragment} from 'bim-fragment/fragment';
import {TypeManager} from "./TypeManager";

// import {downloadZip} from "client-zip";
import {PropertyManagerAPI} from "./properties/BaseDefinitions";
import {IFCModel} from "./IFCModel";
import {IfcTypesMap} from "./IfcTypesMap";

export interface ParserProgress {
    loaded: number;
    total: number;
}

export interface OptionalCategories {
    [category: number]: boolean
}

export class FragmentGroup extends IFCModel {
    fragments: Fragment[] = [];
    levelRelationships: any;
    allTypes: any;
    itemTypes: any;
    floorsProperties: any;
}

export interface GeometriesByMaterial {
    [materialID: string]: {
        material: MeshLambertMaterial,
        geometries: BufferGeometry[]
    }
}

/**
 * Reads all the geometry of the IFC file and generates an optimized `THREE.Mesh`.
 */
export class FragmentParser {

    // Categories that always will be instanced
    instancedCategories = new Set<number>();

    // Generate at least one chunk by floor
    splitByFloors = true;

    // Generate at least one chunk by category
    splitByCategory = true;

    loadedModels = 0;

    optionalCategories: OptionalCategories = {
        [IFCSPACE]: true,
        [IFCOPENINGELEMENT]: false,
    };

    private items: {
        [geometryID: string]: {
            instances: { id: number; matrix: Matrix4 }[];
            geometriesByMaterial: { [materialID: string]: BufferGeometry[] }
            referenceMatrix: Matrix4;
        }
    } = {};

    private materials: { [materialID: string]: MeshLambertMaterial } = {};

    // private geometriesByMaterials: GeometriesByMaterial = {};

    private loadingState = {
        total: 0,
        current: 0,
        step: 0.1,
    };

    // Represents the index of the model in webIfcAPI
    private currentWebIfcID = -1;
    // When using JSON data for optimization, webIfcAPI is reinitialized every time a model is loaded
    // This means that currentID is always 0, while currentModelID is the real index of stored models
    private currentModelID = -1;

    // BVH is optional because when using workers we have to apply it in the main thread,
    // once the model has been serialized and reconstructed
    constructor(private state: IfcState, private properties?: PropertyManagerAPI, private types?: TypeManager, private BVH?: BvhManager) {
    }

    async setupOptionalCategories(config: OptionalCategories) {
        this.optionalCategories = config;
    }

    async parse(buffer: any, coordinationMatrix?: number[]) {
        if (this.state.api.wasmModule === undefined) {
            await this.state.api.Init();
        }
        await this.newIfcModel(buffer);
        this.loadedModels++;
        if (coordinationMatrix) {
            await this.state.api.SetGeometryTransformation(this.currentWebIfcID, coordinationMatrix);
        }
        return await this.loadAllGeometry(this.currentWebIfcID);
    }

    getAndClearErrors(_modelId: number) {
        // return this.state.api.GetAndClearErrors(modelId);
    }

    private notifyProgress(loaded: number, total: number) {
        if (this.state.onProgress) {
            this.state.onProgress({loaded, total});
        }
    }

    private async newIfcModel(buffer: any) {
        const data = new Uint8Array(buffer);
        this.currentWebIfcID = await this.state.api.OpenModel(data, this.state.webIfcSettings);
        this.currentModelID = this.state.useJSON ? this.loadedModels : this.currentWebIfcID;
        this.state.models[this.currentModelID] = {
            modelID: this.currentModelID,
            mesh: {} as IfcMesh,
            types: {},
            jsonData: {},
        };
    }

    private async loadAllGeometry(modelID: number) {
        this.addOptionalCategories(modelID);
        await this.initializeLoadingState(modelID);

        this.instancedCategories.add(IFCFURNISHINGELEMENT);
        this.instancedCategories.add(IFCWINDOW);
        this.instancedCategories.add(IFCDOOR);

        this.state.api.StreamAllMeshes(modelID, (mesh: FlatMesh) => {
            this.updateLoadingState();
            // only during the lifetime of this function call, the geometry is available in memory
            this.streamMesh(modelID, mesh);
        });

        if (this.splitByCategory && this.types) {
            await this.types.getAllTypes();
        }

        const floorProperties: any[] = [];
        let tree: { [itemID: number]: number } = {};
        if (this.splitByFloors && this.properties) {
            const project = await this.properties.getSpatialStructure(modelID);
            const floors = project.children[0].children[0].children;
            for (const floor of floors) {

                const props = await this.properties.getItemProperties(modelID, floor.expressID, false);
                floorProperties.push(props);

                for (const item of floor.children) {
                    tree[item.expressID] = floor.expressID;
                    if (item.children.length) {
                        for (const child of item.children) {
                            tree[child.expressID] = floor.expressID;
                        }
                    }
                }
            }
        }

        const model = new FragmentGroup();
        const fragmentsData = Object.values(this.items);

        const uniqueItems: {
            [category: string]: {
                [floor: string]: {
                    [materialID: string]: BufferGeometry[]
                }
            }
        } = {};

        const expressIdBlockIdMap: {
            [category: number]: {
                [level: number]: {
                    [expressID: number]: number
                }
            }
        } = [];
        let blockCounter = 0;

        for (const data of fragmentsData) {
            const size = data.instances.length;

            const id = data.instances[0].id;
            const typeNumber = this.state.models[0].types[id];

            // Gather unique items to merge them together in a single fragment
            const isUnique = size === 1;

            // Each repeated item will be a separate fragment
            if (!isUnique || this.instancedCategories.has(typeNumber)) {

                const mats = Object.keys(data.geometriesByMaterial).map(id => this.materials[id]);
                const geoms = Object.values(data.geometriesByMaterial);
                const merged = GeometryUtils.merge(geoms);

                const fragment = new Fragment(merged, mats, size);
                for (let i = 0; i < size; i++) {
                    const instance = data.instances[i];
                    fragment.setInstance(i, {
                        ids: [instance.id],
                        transform: instance.matrix
                    })
                }
                model.fragments.push(fragment);
                model.add(fragment.mesh);

            } else {

                // Unique items will be collapsed to save draw calls

                for (const matID in data.geometriesByMaterial) {

                    const id = data.instances[0].id;
                    const category = this.splitByCategory ? this.state.models[modelID].types[id] : -1;
                    if (!uniqueItems[category]) uniqueItems[category] = {};

                    const level = this.splitByFloors ? tree[id] : -1;
                    if (!uniqueItems[category][level]) uniqueItems[category][level] = {};

                    if (!uniqueItems[category][level][matID]) uniqueItems[category][level][matID] = [];
                    const geometries = data.geometriesByMaterial[matID];
                    const instance = data.instances[0];

                    for (const geom of geometries) {
                        geom.userData.id = id;
                        uniqueItems[category][level][matID].push(geom);

                        geom.applyMatrix4(instance.matrix);
                    }
                }
            }
        }

        for (const categoryString in uniqueItems) {
            for (const levelString in uniqueItems[categoryString]) {
                const category = parseInt(categoryString);
                const level = parseInt(levelString);
                if (!level || !category) continue;
                const mats = Object.keys(uniqueItems[category][level]).map(id => this.materials[id]);
                const geometries = Object.values(uniqueItems[category][level]);

                let size = 0;
                const itemsIDs = new Set<number>()
                for (const geometryGroup of geometries) {
                    for (const geom of geometryGroup) {
                        size += geom.attributes.position.count;
                        itemsIDs.add(geom.userData.id);
                    }
                }

                const buffer = new Uint32Array(size);
                const currentIDs = new Map<number, number>();
                let offset = 0;
                let blockID = 0;

                for (const geometryGroup of geometries) {
                    for (const geom of geometryGroup) {
                        if (!currentIDs.has(geom.userData.id)) {
                            currentIDs.set(geom.userData.id, blockID++);
                        }
                        const size = geom.attributes.position.count;
                        const currentBlockID = currentIDs.get(geom.userData.id) as number;
                        buffer.fill(currentBlockID, offset, offset + size);
                        offset += size;
                    }
                }


                const merged = GeometryUtils.merge(geometries);
                merged.setAttribute('blockID', new BufferAttribute(buffer, 1));
                const mergedFragment = new Fragment(merged, mats, 1);
                const ids = Array.from(itemsIDs);

                mergedFragment.setInstance(0, {ids, transform: new Matrix4()});
                model.fragments.push(mergedFragment);
                model.add(mergedFragment.mesh);
            }
        }

        // const files: File[] = [];
        // for (const frag of model.fragments) {
        //     const file = await frag.export();
        //     files.push(file.geometry, file.data);
        // }
        //
        // files.push(new File([JSON.stringify(tree)], 'levels-relationship.json'));
        // files.push(new File([JSON.stringify(this.state.models[modelID].types)], 'model-types.json'));
        // files.push(new File([JSON.stringify(IfcTypesMap)], 'all-types.json'));
        // files.push(new File([JSON.stringify(floorProperties)], 'levels-properties.json'));

        model.levelRelationships = tree;
        model.allTypes = IfcTypesMap;
        model.itemTypes = this.state.models[modelID].types;
        model.floorsProperties = floorProperties;

        // await this.downloadFiles(files);

        for (let data of fragmentsData) {
            (data.geometriesByMaterial as any) = null;
            (data.instances as any) = null;
            (data.referenceMatrix as any) = null;
        }

        this.items = {};
        this.materials = {};

        this.notifyLoadingEnded();

        this.state.models[this.currentModelID].mesh = model as any;
        return model;
    }

    private async initializeLoadingState(modelID: number) {
        const shapes = await this.state.api.GetLineIDsWithType(modelID, IFCPRODUCTDEFINITIONSHAPE);
        this.loadingState.total = shapes.size();
        this.loadingState.current = 0;
        this.loadingState.step = 0.1;
    }

    private notifyLoadingEnded() {
        this.notifyProgress(this.loadingState.total, this.loadingState.total);
    }

    private updateLoadingState() {
        const realCurrentItem = Math.min(this.loadingState.current++, this.loadingState.total);
        if (realCurrentItem / this.loadingState.total >= this.loadingState.step) {
            const currentProgress = Math.ceil(this.loadingState.total * this.loadingState.step);
            this.notifyProgress(currentProgress, this.loadingState.total);
            this.loadingState.step += 0.1;
        }
    }

    // Some categories (like IfcSpace and IfcOpeningElement) need to be set explicitly
    private addOptionalCategories(modelID: number) {

        const optionalTypes: number[] = [];

        for (let key in this.optionalCategories) {
            if (this.optionalCategories.hasOwnProperty(key)) {
                const category = parseInt(key);
                if (this.optionalCategories[category]) {
                    optionalTypes.push(category);
                }
            }
        }

        this.state.api.StreamAllMeshesWithTypes(this.currentWebIfcID, optionalTypes, (mesh: FlatMesh) => {
            this.streamMesh(modelID, mesh);
        });
    }

    private streamMesh(modelID: number, mesh: FlatMesh) {
        const placedGeometries = mesh.geometries;
        const size = placedGeometries.size();

        let geometryID = '';
        let referenceMatrix = new Matrix4();
        let isFirstMatrix = true;

        const geoms: {
            [color: string]: BufferGeometry[]
        } = {};

        // Find the ID of this geometry. The ID is a concatenation of all the IDs
        // of the individual geometries that compose this object
        for (let i = 0; i < size; i++) {
            const placedGeometry = placedGeometries.get(i);
            geometryID += placedGeometry.geometryExpressID;
        }

        // If it's the first time that we find this geometry
        if (!this.items[geometryID]) {

            // Get all buffergeometries
            for (let i = 0; i < size; i++) {
                const placedGeometry = placedGeometries.get(i);
                const geom = this.getBufferGeometry(modelID, placedGeometry);
                if (!geom) {
                    return;
                }

                const matrix = this.getMeshMatrix(placedGeometry.flatTransformation);

                // We apply the tranformation only to the first geometry, and then
                // apply the inverse to the rest of the instances
                geom.applyMatrix4(matrix);

                // We store this matrix to use it as a reference point. We'll apply this
                // later to the rest of the instances
                if (isFirstMatrix) {
                    const inverse = new Matrix4().copy(matrix).invert();
                    referenceMatrix = inverse;
                    isFirstMatrix = false;
                }

                // Save this geometry by material
                const color = placedGeometry.color;
                const colorID = `${color.x}${color.y}${color.z}${color.w}`;

                // Share materials across the model
                if (!this.materials[colorID]) {
                    this.materials[colorID] = new MeshLambertMaterial({
                        color: new Color(color.x, color.y, color.z),
                        transparent: color.w !== 1,
                        opacity: color.w
                    })
                }

                if (!geoms[colorID]) {
                    geoms[colorID] = [geom];
                } else {
                    geoms[colorID].push(geom);
                }
            }

            // Merge the geometries by material
            // const geometriesByMaterial = Object.values(geoms);
            // const materials = geometriesByMaterial.map(item => item.material);
            // const geometries = geometriesByMaterial.map(item => item.geometries);
            // const geometry = GeometryUtils.merge(geometries);

            this.items[geometryID] = {
                instances: [{
                    id: mesh.expressID,
                    matrix: new Matrix4(),
                }],
                geometriesByMaterial: geoms,
                referenceMatrix
            };


            // If it's not the first time we find this geometry, just find out its
            // transformation relative to the first item that was found
        } else {

            const referenceMatrix = this.items[geometryID].referenceMatrix;
            const placedGeometry = placedGeometries.get(0);
            const transform = this.getMeshMatrix(placedGeometry.flatTransformation);
            transform.multiply(referenceMatrix);

            this.items[geometryID].instances.push({
                id: mesh.expressID,
                matrix: transform
            })

        }

    }

    // private getPlacedGeometry(modelID: number, expressID: number, placedGeometry: PlacedGeometry) {
    //     const geometry = this.getBufferGeometry(modelID, expressID, placedGeometry);
    //     const mesh = new Mesh(geometry);
    //     mesh.matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
    //     mesh.matrixAutoUpdate = false;
    //     return mesh;
    // }

    private getBufferGeometry(modelID: number, placedGeometry: PlacedGeometry) {
        const geometry = this.state.api.GetGeometry(modelID, placedGeometry.geometryExpressID) as IfcGeometry;
        const verts = this.state.api.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize()) as Float32Array;
        if (!verts.length) return null;
        const indices = this.state.api.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize()) as Uint32Array;
        if (!indices.length) return null;
        const buffer = this.ifcGeometryToBuffer(verts, indices);
        //@ts-ignore
        geometry.delete();
        return buffer;
    }

    private getMeshMatrix(matrix: Array<number>) {
        const mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
    }

    private ifcGeometryToBuffer(vertexData: Float32Array, indexData: Uint32Array) {
        const geometry = new BufferGeometry();

        const posFloats = new Float32Array(vertexData.length / 2);
        const normFloats = new Float32Array(vertexData.length / 2);
        // const idAttribute = new Uint32Array(vertexData.length / 6);

        for (let i = 0; i < vertexData.length; i += 6) {
            posFloats[i / 2] = vertexData[i];
            posFloats[i / 2 + 1] = vertexData[i + 1];
            posFloats[i / 2 + 2] = vertexData[i + 2];

            normFloats[i / 2] = vertexData[i + 3];
            normFloats[i / 2 + 1] = vertexData[i + 4];
            normFloats[i / 2 + 2] = vertexData[i + 5];

            // idAttribute[i / 6] = expressID;
        }

        geometry.setAttribute(
            'position',
            new BufferAttribute(posFloats, 3));
        geometry.setAttribute(
            'normal',
            new BufferAttribute(normFloats, 3));

        geometry.setIndex(new BufferAttribute(indexData, 1));
        return geometry;
    }
}