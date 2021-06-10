import { IFCManager } from './IFC/IFCManager';
import {
    BufferGeometry,
    FileLoader,
    Intersection,
    Loader,
    LoadingManager,
    Mesh,
    Object3D,
    Scene
} from 'three';
import { Display, HighlightConfig, IfcMesh } from './IFC/BaseDefinitions';

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
     * @modelID The ID of the IFC model.
     * @faceIndex The index of the face of a geometry.You can easily get this index using the [Raycaster](https://threejs.org/docs/#api/en/core/Raycaster).
     */
    getExpressId(modelID: number, faceIndex: number) {
        return this.ifcManager.getExpressId(modelID, faceIndex);
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
     */
    getAllItemsOfType(modelID: number, type: number, properties = false) {
        return this.ifcManager.getAllItemsOfType(modelID, type, properties);
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
     * @recursive Wether you want to get the information of the referenced elements recursively.
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
     * @recursive Wether you want to get the information of the referenced elements recursively.
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
     * @recursive Wether you want to get the information of the referenced elements recursively.
     */
    getSpatialStructure(modelID: number, recursive = false) {
        return this.ifcManager.getSpatialStructure(modelID, recursive);
    }

    /**
     * Returns the first visible or transparent Intersection of the given array.
     * If you you use the
     * [Raycaster](https://threejs.org/docs/#api/en/core/Raycaster), you will
     * get an array of Intersections, and you probably want to get the closest
     * intersection to the camera. This is complex because due to the geometry
     * optimizations of IFC.js. Use this method to get it right away.
     * @items The items you get with [raycaster.intersectObjects()](https://threejs.org/docs/#api/en/core/Raycaster.intersectObjects).
     * @transparent If true, it picks the translucent items as well.
     *
     */
    highlight(modelID: number, id: number[], scene: Scene, config: HighlightConfig) {
        return this.ifcManager.highlight(modelID, id, scene, config);
    }

    /**
     * Sets the RGB color and transparency of the specified items.
     * @modelID The ID of the IFC model.
     * @ids The items whose visibility to change.
     * @state The state of view to apply. This is an object of type `Display`, which has the properties `r`, `g` and `b`(red, green and blue), which can have a value between 0 (pure black) and 1 (pure color); `a` (alfa), which can have a value between 0 * (transparent) and 1 (opaque), and `h` (highlighted), which can be either 0 (not highlighted) * or 1 (highlighted). Only highlighted elements will display the specified color + transparency. 
     * 
     * If any of this attributes is -1, the property won't be updated, thus improving the performance of the operation.
     * @scene The current Three scene.
     */
    setItemsDisplay(modelID: number, ids: number[], state: Display, scene: Scene) {
        this.ifcManager.setItemsDisplay(modelID, ids, state, scene);
    }

    /**
     * Sets the RGB color and transparency of the specified model.
     * @modelID The ID of the IFC model.
     * @ids The items whose visibility to change.
     * @state The state of view to apply. This is an object of type `Display`, which has the properties `r`, `g` and `b`(red, green and blue), which can have a value between 0 (pure black) and 1 (pure color); `a` (alfa), which can have a value between 0 * (transparent) and 1 (opaque), and `h` (highlighted), which can be either 0 (not highlighted) * or 1 (highlighted). Only highlighted elements will display the specified color + transparency.
     * 
     * If any of this attributes is -1, the property won't be updated, thus improving the performance of the operation.
     * @scene The current Three scene.
     */
    setModelDisplay(modelID: number, state: Display, scene: Scene) {
        this.ifcManager.setModelDisplay(modelID, state, scene);
    }
}

export { IFCLoader };
