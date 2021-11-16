import { BufferAttribute, BufferGeometry, Material, Mesh, MeshBasicMaterial } from 'three';

export class ItemSelector {
    constructor(scene, ifcModels, raycaster, highlightMaterial) {
        this.scene = scene;
        this.ifcModels = ifcModels;
        this.raycaster = raycaster;
        this.previousSelectedFace = null;
        this.previousSelection = null;
        this.material = highlightMaterial;
        this.currentItemID = -1;
        this.currentModel = null;

        this.geom = new BufferGeometry();

        this.material = new MeshBasicMaterial({ color: "red", depthTest: false });
        const cube = new Mesh( this.geom , this.material );
        this.cube = cube;
        this.previousObject = cube;
        this.scene.add(cube);

        this.mapCache = {}
        this.indexCache = null;

        // Geometry Caching
        this.geomCacheEnabled = false;
        this.cacheThresold = 40000;
        this.geomCache = {}

        this.subsetSelection = []

        // Random stuff
        window.onkeydown = async (event) => {

            console.log(event);

            if(event.code === "Delete"){
                this.subsetSelection = [];
            }
            if(event.code === "KeyS"){
                this.generateGeometryForItems(0, this.subsetSelection)
            }
            if(event.code === "KeyA"){
                const ids = [];

                const collectIDs = (node) => {
                    ids.push(node.expressID)
                    if(node.children) node.children.forEach(collectIDs)
                }
                const structure = await this.currentModel.ifcManager.getSpatialStructure(0);
                collectIDs(structure);

                this.generateGeometryForItems(0, ids);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async select(event, logTree = false, logProps = false, removePrevious = true) {
        const geometries = this.raycaster.cast(event);
        if (geometries.length <= 0) return;
        const item = geometries[0];
        if (this.previousSelectedFace === item.faceIndex) return;
        this.previousSelectedFace = item.faceIndex;
        await this.getModelAndItemID(item);
        this.highlightModel(removePrevious);
        if (logTree) await this.logTree();
        if (logProps) await this.logProperties();
    }

    previousObject = null;

    getSmallestIndex(start, end, geometry){
        let smallestIndex = -1;

        for (let i = start; i < end; i++) {
            const index = geometry.index.array[i];
            if (smallestIndex === -1 || smallestIndex > index) smallestIndex = index;
        }

        return smallestIndex;
    }

    generateGeometryIndexMap(modelID, geometry) {
        if(this.mapCache[modelID]) {
            return this.mapCache[modelID]
        }

        if(!this.indexCache){
            this.indexCache = geometry.index.array.slice(0, geometry.index.array.length);
        }

        const map = new Map();

        if (!geometry.index) throw new Error('BufferGeometry is not indexed.');

        for (const group of geometry.groups) {

            let prevExpressID = -1;

            const materialIndex = group.materialIndex;
            const materialStart = group.start;
            const materialEnd = materialStart + group.count - 1;

            let objectStart = -1;
            let objectEnd = -1;

            for (let i = materialStart; i <= materialEnd; i++) {
                const index = geometry.index.array[i];
                const expressID = geometry.attributes.expressID.array[index];

                // First iteration
                if (prevExpressID === -1) {
                    prevExpressID = expressID;
                    objectStart = i;
                }

                // It's the end of the material, which also means end of the object
                const isEndOfMaterial = i === materialEnd;
                if (isEndOfMaterial) {
                    const store = this.getMaterialStore(map, expressID, materialIndex);
                    store.push(objectStart, materialEnd);
                    break;
                }

                // Still going through the same object
                if (prevExpressID === expressID) continue;

                // New object starts; save previous object

                // Store previous object
                const store = this.getMaterialStore(map, prevExpressID, materialIndex);
                objectEnd = i - 1;
                store.push(objectStart, objectEnd);

                // Get ready to process next object
                prevExpressID = expressID;
                objectStart = i;
            }
        }
        this.mapCache[modelID] = map;
        return map;
    }

    getMaterialStore(map, id, matIndex) {
        // If this object wasn't store before, add it to the map
        if (map.get(id) === undefined) {
            map.set(id, {});
        }
        const storedIfcItem = map.get(id);
        if (storedIfcItem === undefined) throw new Error('Geometry map generation error');

        // If this material wasn't stored for this object before, add it to the object
        if (storedIfcItem[matIndex] === undefined) {
            storedIfcItem[matIndex] = [];
        }
        return storedIfcItem[matIndex];
    }

    highlightModel(removePrevious) {
        this.generateGeometryForItems(this.currentModel, [this.currentItemID]);
        this.subsetSelection.push(this.currentItemID);
    }

    async logTree() {
        const tree = await this.currentModel.ifcManager.getSpatialStructure(0);
        console.log(tree);
    }

    async logProperties() {
        const modelID = this.currentModel.modelID;
        const id = this.currentItemID;
        const props = await this.currentModel.ifcManager.getItemProperties(modelID, id);
        props.psets = await this.currentModel.ifcManager.getPropertySets(modelID, id);
        props.mats = await this.currentModel.ifcManager.getMaterialsProperties(modelID, id);
        props.type = await this.currentModel.ifcManager.getTypeProperties(modelID, id);
        console.log(props);
    }

    async getModelAndItemID(item) {
        const modelID = item.object.modelID;
        this.currentModel = this.ifcModels.find(model => model.modelID === modelID);
        if (!this.currentModel) {
            throw new Error('The selected item doesn\'t belong to a model!');
        }
        this.currentItemID = await this.currentModel.ifcManager.getExpressId(item.object.geometry, item.faceIndex);
    }

    removePreviousSelection() {
        const isNotPreviousSelection = this.previousSelection.modelID !== this.currentModel.modelID;
        if (this.previousSelection && isNotPreviousSelection) {
            this.previousSelection.removeSubset(this.scene, this.material);
        }
        this.previousSelection = this.currentModel;
    }

    generateGeometryForItems(modelID, expressIDs){
        const t0 = performance.now();

        const positions = [];
        const normals = [];
        const indexes = [];

        const model = this.currentModel.ifcManager.state.models[0];
        const geometry = model.mesh.geometry;
        const map = this.generateGeometryIndexMap(model.modelID, geometry);

        for(const expressID of expressIDs){

            const entry = map.get(expressID);

            if (!geometry.index) throw new Error(`BufferGeometry is not indexed.`)
            if (!entry) {
                // console.error(`Entry for expressID: ${expressID} not found.`)
                continue;
            }

            for (const materialIndex in entry) {

                const value = entry[Number.parseInt(materialIndex)];
                const pairs = value.length / 2;

                for (let pair = 0; pair < pairs; pair++){

                    const pairIndex = pair * 2;
                    const start = value[pairIndex];
                    const end = value[pairIndex + 1];

                    for (let i = start; i <= end; i++) {

                        const index = this.indexCache[i];
                        const positionIndex = index * 3;
                        const newIndex = indexes.length;
                        indexes.push(newIndex);

                        const v1 = geometry.attributes.position.array[positionIndex];
                        const v2 = geometry.attributes.position.array[positionIndex + 1];
                        const v3 = geometry.attributes.position.array[positionIndex + 2];

                        const n1 = geometry.attributes.normal.array[positionIndex];
                        const n2 = geometry.attributes.normal.array[positionIndex + 1];
                        const n3 = geometry.attributes.normal.array[positionIndex + 2];

                        const newPositionIndex = newIndex * 3;

                        positions[newPositionIndex] = v1;
                        positions[newPositionIndex + 1] = v2;
                        positions[newPositionIndex + 2] = v3;

                        normals[newPositionIndex] = n1;
                        normals[newPositionIndex + 1] = n2;
                        normals[newPositionIndex + 2] = n3;
                    }
                }
            }
        }
        const newGeom = new BufferGeometry();
        const positionNumComponents = 3;
        const normalNumComponents = 3;
        newGeom.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(positions), positionNumComponents));
        newGeom.setAttribute(
            'normal',
            new BufferAttribute(new Float32Array(normals), normalNumComponents));
        newGeom.setIndex(indexes);

        const cube = new Mesh(newGeom, new MeshBasicMaterial({ color: "red", depthTest: false,}));
        this.scene.add(cube);

        if(this.previousObject){
            this.scene.remove(this.previousObject);
        }

        this.previousObject = cube;

        const t1 = performance.now();
        console.log(`Pick took ${t1 - t0} milliseconds.`);
    }
}