import { BufferGeometry, Material, Mesh, Object3D, Scene } from 'three';
import { IFCManager } from './IFCManager';
import { BaseSubsetConfig } from '../BaseDefinitions';

const nullIfcManagerErrorMessage = 'IfcManager is null!';

/**
 * Represents an IFC model. This object is returned by the `IFCLoader` after loading an IFC.
 * @geometry `THREE.Buffergeometry`, see Three.js documentation.
 * @materials `THREE.Material[]`, see Three.js documentation.
 * @manager contains all the logic to work with IFC.
 */
export class IFCModel extends Mesh {

    private static modelIdCounter = 0;

    static dispose() {
        IFCModel.modelIdCounter = 0;
    }

    modelID = IFCModel.modelIdCounter++;
    ifcManager: IFCManager | null = null;

    /**
     * @deprecated `IfcModel` is already a mesh; you can place it in the scene directly.
     */
    mesh = this;

    setIFCManager(manager: IFCManager) {
        this.ifcManager = manager;
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.setWasmPath` instead.
     *
     * Sets the relative path of web-ifc.wasm file in the project.
     * Beware: you **must** serve this file in your page; this means
     * that you have to copy this files from *node_modules/web-ifc*
     * to your deployment directory.
     *
     * If you don't use this methods,
     * IFC.js assumes that you are serving it in the root directory.
     *
     * Example if web-ifc.wasm is in dist/wasmDir:
     * `ifcLoader.setWasmPath("dist/wasmDir/");`
     *
     * @path Relative path to web-ifc.wasm.
     */
    setWasmPath(path: string) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        this.ifcManager.setWasmPath(path);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.close` instead.
     *
     * Closes the specified model and deletes it from the [scene](https://threejs.org/docs/#api/en/scenes/Scene).
     * @scene Scene where the model is (if it's located in a scene).
     */
    close(scene?: Scene) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        this.ifcManager.close(this.modelID, scene);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getExpressId` instead.
     *
     * Gets the **Express ID** to which the given face belongs.
     * This ID uniquely identifies this entity within this IFC file.
     * @geometry The geometry of the IFC model.
     * @faceIndex The index of the face of a geometry.You can easily get this index using the [Raycaster](https://threejs.org/docs/#api/en/core/Raycaster).
     */
    getExpressId(geometry: BufferGeometry, faceIndex: number) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getExpressId(geometry, faceIndex);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getAllItemsOfType` instead.
     *
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
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getAllItemsOfType(this.modelID, type, verbose);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getItemProperties` instead.
     *
     * Gets the native properties of the given element.
     * @id Express ID of the element.
     * @recursive Wether you want to get the information of the referenced elements recursively.
     */
    getItemProperties(id: number, recursive = false) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getItemProperties(this.modelID, id, recursive);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getPropertySets` instead.
     *
     * Gets the [property sets](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifckernel/lexical/ifcpropertyset.htm)
     * assigned to the given element.
     * @id Express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getPropertySets(id: number, recursive = false) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getPropertySets(this.modelID, id, recursive);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getTypeProperties` instead.
     *
     * Gets the properties of the type assigned to the element.
     * For example, if applied to a wall (IfcWall), this would get back the information
     * contained in the IfcWallType assigned to it, if any.
     * @id Express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getTypeProperties(id: number, recursive = false) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getTypeProperties(this.modelID, id, recursive);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getIfcType` instead.
     *
     * Gets the ifc type of the specified item.
     * @id Express ID of the element.
     */
    getIfcType(id: number) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getIfcType(this.modelID, id);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getSpatialStructure` instead.
     *
     * Gets the spatial structure of the project. The
     * [spatial structure](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifcproductextension/lexical/ifcspatialstructureelement.htm)
     * is the hierarchical structure that organizes every IFC project (all physical items
     * are referenced to an element of the spatial structure). It is formed by
     * one IfcProject that contains one or more IfcSites, that contain one or more
     * IfcBuildings, that contain one or more IfcBuildingStoreys, that contain
     * one or more IfcSpaces.
     */
    getSpatialStructure() {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getSpatialStructure(this.modelID);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.getSubset` instead.
     *
     * Gets the mesh of the subset with the specified [material](https://threejs.org/docs/#api/en/materials/Material).
     * If no material is given, this returns the subset with the original materials.
     * @material Material assigned to the subset, if any.
     */
    getSubset(material?: Material) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        return this.ifcManager.getSubset(this.modelID, material);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.removeSubset` instead.
     *
     * Removes the specified subset.
     * @parent The parent where the subset is (can be any `THREE.Object3D`).
     * @material Material assigned to the subset, if any.
     */
    removeSubset(material?: Material, customID?: string) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        this.ifcManager.removeSubset(this.modelID, material, customID);
    }

    /**
     * @deprecated Use `IfcModel.ifcManager.createSubset` instead.
     *
     * Creates a new geometric subset.
     * @config A configuration object with the following options:
     * - **scene**: `THREE.Object3D` where the model is located.
     * - **ids**: Express IDs of the items of the model that will conform the subset.
     * - **removePrevious**: Wether to remove the previous subset of this model with this material.
     * - **material**: (optional) Wether to apply a material to the subset
     */
    createSubset(config: BaseSubsetConfig) {
        if (this.ifcManager === null) throw new Error(nullIfcManagerErrorMessage);
        const modelConfig = { ...config, modelID: this.modelID };
        return this.ifcManager.createSubset(modelConfig);
    }
}
