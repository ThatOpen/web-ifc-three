import * as WebIFC from 'web-ifc';
import { IFCParser } from './IFCParser';
import { SubsetManager } from './SubsetManager';
import { PropertyManager } from './PropertyManager';
import { IfcElements } from './IFCElementsMap';
import { TypeManager } from './TypeManager';
import { HighlightConfigOfModel, IfcState } from '../BaseDefinitions';
import { BufferGeometry, Material, Scene } from 'three';
import { IFCModel } from './IFCModel';
import { BvhManager } from './BvhManager';

/**
 * Contains all the logic to work with the loaded IFC files (select, edit, etc).
 */
export class IFCManager {
    private state: IfcState = { models: [], api: new WebIFC.IfcAPI() };
    private BVH = new BvhManager();
    private parser = new IFCParser(this.state, this.BVH);
    private subsets = new SubsetManager(this.state, this.BVH);
    private properties = new PropertyManager(this.state);
    private types = new TypeManager(this.state);

    async parse(buffer: ArrayBuffer) {
        const mesh = await this.parser.parse(buffer);
        this.types.getAllTypes();
        return new IFCModel(mesh, this);
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
        this.state.api.SetWasmPath(path);
    }

    /**
     * Makes object picking a lot faster
     * Courtesy of gkjohnson's [work](https://github.com/gkjohnson/three-mesh-bvh).
     * Import these objects from his library and pass them as arguments. We'll take care of the rest!
     */
    setupThreeMeshBVH(computeBoundsTree: any, disposeBoundsTree: any, acceleratedRaycast: any ){
        this.BVH.initializeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);
    }

    /**
     * Closes the specified model and deletes it from the scene.
     * @modelID ID of the IFC model.
     * @scene The scene where the model is (if it's located in a scene).
     */
    close(modelID: number, scene?: Scene) {
        this.state.api.CloseModel(modelID);
        if (scene) scene.remove(this.state.models[modelID].mesh);
        delete this.state.models[modelID];
    }

    /**
     * Gets the **Express ID** to which the given face belongs.
     * This ID uniquely identifies this entity within this IFC file.
     * @geometry The geometry of the IFC model.
     * @faceIndex The index of the face of a geometry.You can easily get this index using the [Raycaster](https://threejs.org/docs/#api/en/core/Raycaster).
     */
    getExpressId(geometry: BufferGeometry, faceIndex: number) {
        return this.properties.getExpressId(geometry, faceIndex);
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
     * @modelID ID of the IFC model.
     * @type type of IFC items to get.
     * @verbose If false (default), this only gets IDs. If true, this also gets the native properties of all the fetched items.
     */
    getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
        return this.properties.getAllItemsOfType(modelID, type, verbose);
    }

    /**
     * Gets the native properties of the given element.
     * @modelID ID of the IFC model.
     * @id The express ID of the element.
     * @recursive Wether you want to get the information of the referenced elements recursively.
     */
    getItemProperties(modelID: number, id: number, recursive = false) {
        return this.properties.getItemProperties(modelID, id, recursive);
    }

    /**
     * Gets the [property sets](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifckernel/lexical/ifcpropertyset.htm)
     * assigned to the given element.
     * @modelID ID of the IFC model.
     * @id The express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getPropertySets(modelID: number, id: number, recursive = false) {
        return this.properties.getPropertySets(modelID, id, recursive);
    }

    /**
     * Gets the properties of the type assigned to the element.
     * For example, if applied to a wall (IfcWall), this would get back the information
     * contained in the IfcWallType assigned to it, if any.
     * @modelID ID of the IFC model.
     * @id The express ID of the element.
     * @recursive If true, this gets the native properties of the referenced elements recursively.
     */
    getTypeProperties(modelID: number, id: number, recursive = false) {
        return this.properties.getTypeProperties(modelID, id, recursive);
    }

    /**
     * Gets the ifc type of the specified item.
     * @modelID ID of the IFC model.
     * @id The express ID of the element.
     */
    getIfcType(modelID: number, id: number) {
        const typeID = this.state.models[modelID].types[id];
        return IfcElements[typeID.toString()];
    }

    /**
     * Gets the spatial structure of the project. The
     * [spatial structure](https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifcproductextension/lexical/ifcspatialstructureelement.htm)
     * is the hierarchical structure that organizes every IFC project (all physical items
     * are referenced to an element of the spatial structure). It is formed by
     * one IfcProject that contains one or more IfcSites, that contain one or more
     * IfcBuildings, that contain one or more IfcBuildingStoreys, that contain
     * one or more IfcSpaces.
     * @modelID ID of the IFC model.
     */
    getSpatialStructure(modelID: number) {
        return this.properties.getSpatialStructure(modelID);
    }

    /**
     * Gets the mesh of the specified subset.
     * @modelID ID of the IFC model.
     * @material The material assigned to the subset, if any.
     */
    getSubset(modelID: number, material?: Material) {
        return this.subsets.getSubset(modelID, material);
    }

    /**
     * Removes the specified subset.
     * @modelID ID of the IFC model.
     * @scene The scene where the subset is.
     * @material The material assigned to the subset, if any.
     */
    removeSubset(modelID: number, scene?: Scene, material?: Material) {
        this.subsets.removeSubset(modelID, scene, material);
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
    createSubset(config: HighlightConfigOfModel) {
        return this.subsets.createSubset(config);
    }
}
