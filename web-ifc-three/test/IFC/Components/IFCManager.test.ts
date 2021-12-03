import {IFCManager} from "../../../src/IFC/components/IFCManager";
import {SubsetManager} from '../../../src/IFC/components/subsets/SubsetManager';
import {PropertyManager} from '../../../src/IFC/components/properties/PropertyManager';
import {IFCParser} from "../../../src/IFC/components/IFCParser";
import {BaseSubsetConfig, IfcMesh} from "../../../src/IFC/BaseDefinitions";
import * as WebIFC from "web-ifc";
import {BufferGeometry, Material, Scene} from "three";


describe("IFCManager", () => {

    let ifcManager: IFCManager;

    beforeEach(() => {
        ifcManager = new IFCManager();
    });

    test('parse', (done) => {

        const spyParse = jest.spyOn(IFCParser.prototype, 'parse').mockReturnValue(new Promise((resolve => resolve(<IfcMesh>{}))));

        let arrayBuffer = new ArrayBuffer(10);
        ifcManager.parse(arrayBuffer).then(() => {
            expect(spyParse).toHaveBeenCalledWith(arrayBuffer);
            done();
        });
    });

    test('setWasmPath', () => {

        const spSetWasmPath = jest.spyOn(WebIFC.IfcAPI.prototype, 'SetWasmPath');

        ifcManager.setWasmPath('/test/path');

        expect(spSetWasmPath).toHaveBeenCalledWith('/test/path')
    });

    test('close: without scene', () => {

        const spyCloseModel = jest.spyOn(WebIFC.IfcAPI.prototype, 'CloseModel').mockImplementation();

        const currentState = Reflect.get(ifcManager, 'state');
        Reflect.set(ifcManager, 'state', { ...currentState, models: {10: {modelID: 10, types: {}, mesh: null, items: {}}}});

        ifcManager.close(10);

        expect(spyCloseModel).toHaveBeenCalledWith(10);

        const stateAfterClose = Reflect.get(ifcManager, 'state');
        expect(stateAfterClose.models[10]).toBe(undefined);
    });

    test('close: with scene', () => {

        const spyCloseModel = jest.spyOn(WebIFC.IfcAPI.prototype, 'CloseModel').mockImplementation();

        const scene = new Scene();
        const spyScene = jest.spyOn(scene, 'remove').mockImplementation();

        const currentState = Reflect.get(ifcManager, 'state');
        Reflect.set(ifcManager, 'state', { ...currentState, models: {10: {modelID: 10, types: {}, mesh: null, items: {}}}});

        ifcManager.close(10, scene);

        expect(spyCloseModel).toHaveBeenCalledWith(10);
        expect(spyScene).toHaveBeenCalledWith(null);

        const stateAfterClose = Reflect.get(ifcManager, 'state');
        expect(stateAfterClose.models[10]).toBe(undefined);
    });

    test('getExpressId', () => {

        const spyGetExpressId = jest.spyOn(PropertyManager.prototype, 'getExpressId').mockImplementation();

        const bufferGeometry = new BufferGeometry();
        ifcManager.getExpressId(bufferGeometry, 10);

        expect(spyGetExpressId).toHaveBeenCalledWith(bufferGeometry, 10);
    });

    test('getAllItemsOfType', () => {

        const spyGetAllItemsOfType = jest.spyOn(PropertyManager.prototype, 'getAllItemsOfType').mockImplementation();

        ifcManager.getAllItemsOfType(10, 5, false);

        expect(spyGetAllItemsOfType).toHaveBeenCalledWith(10, 5, false);
    });

    test('getItemProperties', () => {

        const spyGetItemProperties = jest.spyOn(PropertyManager.prototype, 'getItemProperties').mockImplementation();

        ifcManager.getItemProperties(10, 5, false);

        expect(spyGetItemProperties).toHaveBeenCalledWith(10, 5, false);
    });

    test('getPropertySets', () => {

        const spyGetPropertySets = jest.spyOn(PropertyManager.prototype, 'getPropertySets').mockImplementation();

        ifcManager.getPropertySets(10, 5, false);

        expect(spyGetPropertySets).toHaveBeenCalledWith(10, 5, false);
    });

    test('getTypeProperties', () => {

        const spyGetTypeProperties = jest.spyOn(PropertyManager.prototype, 'getTypeProperties').mockImplementation();

        ifcManager.getTypeProperties(10, 5, false);

        expect(spyGetTypeProperties).toHaveBeenCalledWith(10, 5, false);
    });

    test('getIfcType', () => {

        const currentState = Reflect.get(ifcManager, 'state');
        Reflect.set(ifcManager, 'state', { ...currentState, models: {10: {modelID: 10, types: {5: 103090709}, mesh: null, items: {}}}});

        expect(ifcManager.getIfcType(10, 5)).toBe('IFCPROJECT');
    });

    test('getSpatialStructure', () => {

        const spyGetSpatialStructure = jest.spyOn(PropertyManager.prototype, 'getSpatialStructure').mockImplementation();

        ifcManager.getSpatialStructure(10);

        expect(spyGetSpatialStructure).toHaveBeenCalledWith(10);
    });

    test('getSubset', () => {

        const spyGetSubset = jest.spyOn(SubsetManager.prototype, 'getSubset').mockImplementation();

        const material = new Material();
        ifcManager.getSubset(10, material);

        expect(spyGetSubset).toHaveBeenCalledWith(10, material);
    });

    test('removeSubset', () => {

        const spyRemoveSubset = jest.spyOn(SubsetManager.prototype, 'removeSubset').mockImplementation();

        const material = new Material();
        const scene = new Scene();
        ifcManager.removeSubset(10, scene, material);

        expect(spyRemoveSubset).toHaveBeenCalledWith(10, scene, material);
    });

    test('createSubset', () => {

        const spyCreateSubset = jest.spyOn(SubsetManager.prototype, 'createSubset').mockImplementation();

        const highlightConfig: BaseSubsetConfig = {
            scene: new Scene(),
            modelID: 10,
            ids: [1],
            removePrevious: false,
            material: new Material()
        };

        ifcManager.createSubset(highlightConfig);

        expect(spyCreateSubset).toHaveBeenCalledWith(highlightConfig);
    });
});
