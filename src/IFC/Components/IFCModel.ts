import { BufferGeometry, Group, Material, Mesh, Scene } from 'three';
import { HighlightConfig } from '../BaseDefinitions';
import { IFCManager } from './IFCManager';

let modelIdCounter = 0;

/**
 * Represents an IFC model. This object is returned by the `IFCLoader` after loading an IFC.
 * @mesh the `THREE.Mesh` that contains the geometry of the IFC.
 * @modelID the ID of the IFC model.
 */
export class IFCModel extends Group {
    modelID = modelIdCounter++

    constructor(public mesh: Mesh, private ifc: IFCManager) {
        super();
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
        this.ifc.setWasmPath(path);
    }

    /**
     * Closes the specified model and deletes it from the scene
     * @scene The scene where the model is (if it's located in a scene).
     */
    close(scene?: Scene) {
        this.ifc.close(this.modelID, scene);
    }

    /**
     * Gets the **Express ID** to which the given face belongs.
     * This ID uniquely identifies this entity within this IFC file.
     * @geometry The geometry of the IFC model.
     * @faceIndex The index of the face of a geometry.You can easily get this index using the [Raycaster](https://threejs.org/docs/#api/en/core/Raycaster).
     */
    getExpressId(geometry: BufferGeometry, faceIndex: number) {
        return this.ifc.getExpressId(geometry, faceIndex);
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
     * @type The type of IFC items to get.
     * @verbose If false (default), this only gets IDs. If true, this also gets the native properties of all the fetched items.
     */
    getAllItemsOfType(type: number, verbose: boolean) {
        return this.ifc.getAllItemsOfType(this.modelID, type, verbose);
    }

    /**
     * Gets the native properties of the given element.
     * @id The express ID of the element.
     * @recursive Wether you want to get the information of the referenced elements recursively.
     */
    getItemProperties(id: number, recursive = false) {
        return this.ifc.getItemProperties(this.modelID, id, recursive);
    }

    /**
     * Gets the [property sets](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifckernel/lexical/ifcpropertyset.htm)
     * assigned to the given element.
     * @id The express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getPropertySets(id: number, recursive = false) {
        return this.ifc.getPropertySets(this.modelID, id, recursive);
    }

    /**
     * Gets the properties of the type assigned to the element.
     * For example, if applied to a wall (IfcWall), this would get back the information
     * contained in the IfcWallType assigned to it, if any.
     * @id The express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getTypeProperties(id: number, recursive = false) {
        return this.ifc.getTypeProperties(this.modelID, id, recursive);
    }

    /**
     * Gets the ifc type of the specified item.
     * @id The express ID of the element.
     */
    getIfcType(id: number) {
        return this.ifc.getIfcType(this.modelID, id);
    }

    /**
     * Gets the spatial structure of the project. The
     * [spatial structure](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifcproductextension/lexical/ifcspatialstructureelement.htm)
     * is the hierarchical structure that organizes every IFC project (all physical items
     * are referenced to an element of the spatial structure). It is formed by
     * one IfcProject that contains one or more IfcSites, that contain one or more
     * IfcBuildings, that contain one or more IfcBuildingStoreys, that contain
     * one or more IfcSpaces.
     */
    getSpatialStructure() {
        return this.ifc.getSpatialStructure(this.modelID);
    }

    /**
     * Gets the mesh of the specified subset.
     * @material The material assigned to the subset, if any.
     */
    getSubset(material?: Material) {
        return this.ifc.getSubset(this.modelID, material);
    }

    /**
     * Removes the specified subset.
     * @scene The scene where the subset is.
     * @material The material assigned to the subset, if any.
     */
    removeSubset(scene?: Scene, material?: Material) {
        this.ifc.removeSubset(this.modelID, scene, material);
    }

    /**
     * Creates a new geometric subset.
     * @config A configuration object with the following options:
     * - **scene**: the scene where the model is located.
     * - **ids**: the IDs of the items of the model that will conform the subset.
     * - **removePrevious**: wether to remove the previous subset of this model with this material.
     * - **material**: (optional) wether to apply a material to the subset
     */
    createSubset(config: HighlightConfig) {
        const modelConfig = {...config, modelID: this.modelID};
        return this.ifc.createSubset(modelConfig);
    }
}
