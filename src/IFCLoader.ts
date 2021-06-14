import { IFCManager } from './IFC/IFCManager';
import {
    BufferGeometry,
    FileLoader,
    Loader,
    LoadingManager,
    Material,
    Object3D,
    Scene
} from 'three';
import { HighlightConfig } from './IFC/BaseDefinitions';

// tslint:disable-next-line:interface-name
export interface IFC extends Object3D {
    [key: string]: any;
}

class IFCLoader extends Loader {
    private ifcManager: IFCManager;

    constructor(manager?: LoadingManager) {
        super(manager);
        this.ifcManager = new IFCManager();
    }

    load(
        url: any,
        onLoad: (ifc: IFC) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
    ) {
        const scope = this;

        const loader = new FileLoader(scope.manager);
        loader.setPath(scope.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(scope.requestHeader);
        loader.setWithCredentials(scope.withCredentials);
        loader.load(
            url,
            async function (buffer) {
                try {
                    onLoad(await scope.parse(buffer));
                } catch (e) {
                    if (onError) {
                        onError(e);
                    } else {
                        console.error(e);
                    }

                    scope.manager.itemError(url);
                }
            },
            onProgress,
            onError
        );
    }

    parse(buffer: any) {
        return this.ifcManager.parse(buffer);
    }

    /**
     * Sets the relative path of web-ifc.wasm file in the project.
     * Beware: you **must** serve this file in your page; this means
     * that you have to copy this files from *node_modules/web-ifc*
     * to your deployment directory.
     *
     * If you don't use this methods,
     * IFC.js assumes that you are serving it in the root directory.
     *
     * Example if web-ifc.wasm is in dist/wasmDir:
     * ```js
     * ifcLoader.setWasmPath("dist/wasmDir/");
     * ```
     *
     * @path The relative path to web-ifc.wasm.
     */
    setWasmPath(path: string) {
        this.ifcManager.setWasmPath(path);
    }

    /**
     * Closes the specified model and deletes it from the scene
     * @modelID The ID of the model to close.
     * @scene The scene where the model is (if it's located in a scene).
     */
    close(modelID: number, scene?: Scene) {
        return this.ifcManager.close(modelID, scene);
    }

    /**
     * Gets the **Express ID** to which the given face belongs.
     * This ID uniquely identifies this entity within this IFC file.
     * @geometry The geometry of the IFC model.
     * @faceIndex The index of the face of a geometry.You can easily get this index using the [Raycaster](https://threejs.org/docs/#api/en/core/Raycaster).
     */
    getExpressId(geometry: BufferGeometry, faceIndex: number) {
        return this.ifcManager.getExpressId(geometry, faceIndex);
    }

    /**
     * Returns all items of the specified type. You can import
     * the types from *web-ifc*.
     *
     * Example to get all the standard walls of a project:
     * ```js
     * import { IFCWALLSTANDARDCASE } from 'web-ifc';
     * const walls = ifcLoader.getAllItemsOfType(IFCWALLSTANDARDCASE);
     * ```
     * @modelID The ID of the IFC model.
     * @type The type of IFC items to get.
     * @verbose If false (default), this only gets IDs. If true, this also gets the native properties of all the fetched items.
     */
    getAllItemsOfType(modelID: number, type: number, verbose = false) {
        return this.ifcManager.getAllItemsOfType(modelID, type, verbose);
    }

    /**
     * Gets the native properties of the given element.
     * @modelID The ID of the IFC model.
     * @id The express ID of the element.
     * @recursive Wether you want to get the information of the referenced elements recursively.
     */
    getItemProperties(modelID: number, id: number, recursive = false) {
        return this.ifcManager.getItemProperties(modelID, id, recursive);
    }

    /**
     * Gets the [property sets](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifckernel/lexical/ifcpropertyset.htm)
     * assigned to the given element.
     * @modelID The ID of the IFC model.
     * @id The express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getPropertySets(modelID: number, id: number, recursive = false) {
        return this.ifcManager.getPropertySets(modelID, id, recursive);
    }

    /**
     * Gets the properties of the type assigned to the element.
     * For example, if applied to a wall (IfcWall), this would get back the information
     * contained in the IfcWallType assigned to it, if any.
     * @modelID The ID of the IFC model.
     * @id The express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getTypeProperties(modelID: number, id: number, recursive = false) {
        return this.ifcManager.getTypeProperties(modelID, id, recursive);
    }

    /**
     * Gets the spatial structure of the project. The
     * [spatial structure](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifcproductextension/lexical/ifcspatialstructureelement.htm)
     * is the hierarchical structure that organizes every IFC project (all physical items
     * are referenced to an element of the spatial structure). It is formed by
     * one IfcProject that contains one or more IfcSites, that contain one or more
     * IfcBuildings, that contain one or more IfcBuildingStoreys, that contain
     * one or more IfcSpaces.
     * @modelID The ID of the IFC model.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getSpatialStructure(modelID: number, recursive = false) {
        return this.ifcManager.getSpatialStructure(modelID, recursive);
    }

    /**
     * Gets the mesh of the specified subset.
     * @modelID The ID of the IFC model.
     * @material The material assigned to the subset, if any.
     */
    getSubset(modelID: number, material?: Material) {
        return this.ifcManager.getSubset(modelID, material);
    }

    /**
     * Removes the specified subset.
     * @modelID The ID of the IFC model.
     * @modelID The scene where the subset is.
     * @material The material assigned to the subset, if any.
     */
    removeSubset(modelID: number, scene?: Scene, material?: Material) {
        this.ifcManager.removeSubset(modelID, scene, material);
    }

    /**
     * Creates a new geometric subset.
     * @config A configuration object with the following options:
     * - **scene**: the scene where the model is located.
     * - **modelID**: the ID of the model.
     * - **ids**: the IDs of the items of the model that will conform the subset.
     * - **removePrevious**: wether to remove the previous subset of this model with this material.
     * - **material**: (optional) wether to apply a material to the subset
     */
    createSubset(config: HighlightConfig) {
        return this.ifcManager.createSubset(config);
    }
}

export { IFCLoader };
