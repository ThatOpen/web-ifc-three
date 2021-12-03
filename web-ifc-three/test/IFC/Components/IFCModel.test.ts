import {IFCManager} from "../../../src/IFC/components/IFCManager";
import {BufferGeometry, Material, Mesh, Scene} from "three";
import {IFCModel} from "../../../src/IFC/components/IFCModel";
import {BaseSubsetConfig} from "../../../src/IFC/BaseDefinitions";

describe("IFCModel", () => {

    let ifcManager: IFCManager;
    let ifcModel: IFCModel;
    let mesh: Mesh;

    beforeEach(() => {
        ifcManager  = new IFCManager();
        mesh        = new Mesh();
        ifcModel    = new IFCModel(mesh, ifcManager);
    });

    test('setWasmPath', () => {

        const spySetWasmPath = jest.spyOn(ifcManager, 'setWasmPath').mockImplementation();

        ifcModel.setWasmPath('/test/path/');

        expect(spySetWasmPath).toHaveBeenCalledWith('/test/path/');
    });

    test('close', () => {

        const spyClose = jest.spyOn(ifcManager, 'close').mockImplementation();

        const scene = new Scene();

        ifcModel.close(scene);

        expect(spyClose).toHaveBeenCalledWith(1, scene);
    });

    test('getExpressId', () => {

        const spyGetExpressId = jest.spyOn(ifcManager, 'getExpressId').mockReturnValue(10);

        let bufferGeometry = new BufferGeometry();

        const result = ifcModel.getExpressId(bufferGeometry, 10);

        expect(spyGetExpressId).toHaveBeenCalledWith(bufferGeometry, 10);
        expect(result).toBe(10);
    });

    test('getAllItemsOfType', () => {

        const spyGetAllItemsOfType = jest.spyOn(ifcManager, 'getAllItemsOfType').mockImplementation();

        ifcModel.getAllItemsOfType(5, false);

        expect(spyGetAllItemsOfType).toHaveBeenCalledWith(3, 5, false);
    });

    test('getItemProperties', () => {

        const spyGetItemProperties = jest.spyOn(ifcManager, 'getItemProperties').mockImplementation();

        ifcModel.getItemProperties(5, false);

        expect(spyGetItemProperties).toHaveBeenCalledWith(4, 5, false);
    });

    test('getPropertySets', () => {

        const spyGetPropertySets = jest.spyOn(ifcManager, 'getPropertySets').mockImplementation();

        ifcModel.getPropertySets(5, false);

        expect(spyGetPropertySets).toHaveBeenCalledWith(5, 5, false);
    });

    test('getTypeProperties', () => {

        const spyGetTypeProperties = jest.spyOn(ifcManager, 'getTypeProperties').mockImplementation();

        ifcModel.getTypeProperties(5, false);

        expect(spyGetTypeProperties).toHaveBeenCalledWith(6, 5, false);
    });

    test('getIfcType', () => {

        const spyGetIfcType = jest.spyOn(ifcManager, 'getIfcType').mockReturnValue('IFCPROJECT');

        const result = ifcModel.getIfcType(5);

        expect(spyGetIfcType).toHaveBeenCalledWith(7, 5);
        expect(result).toBe('IFCPROJECT');
    });

    test('getSpatialStructure', () => {

        const mockedResult = {
            expressID: 10,
            type: 'IFCPROJECT',
            children: []
        }

        const spyGetSpatialStructure = jest.spyOn(ifcManager, 'getSpatialStructure').mockReturnValue(mockedResult);

        const result = ifcModel.getSpatialStructure();

        expect(spyGetSpatialStructure).toHaveBeenCalledWith(8);
        expect(result).toBe(mockedResult);
    });

    test('getSubset: with martial', () => {

        const spyGetSubset = jest.spyOn(ifcManager, 'getSubset').mockReturnValue(new Mesh());

        const material = new Material();

        const result = ifcModel.getSubset(material);

        expect(spyGetSubset).toHaveBeenCalledWith(9, material);
        expect(result).toBeInstanceOf(Mesh);
    });

    test('getSubset: without material', () => {

        const spyGetSubset = jest.spyOn(ifcManager, 'getSubset').mockReturnValue(new Mesh());

        const result = ifcModel.getSubset();

        expect(spyGetSubset).toHaveBeenCalledWith(10, undefined);
        expect(result).toBeInstanceOf(Mesh);
    });

    test('removeSubset: with material and scene', () => {

        const spyRemoveSubset = jest.spyOn(ifcManager, 'removeSubset').mockImplementation();

        const material = new Material();
        const scene = new Scene();
        ifcModel.removeSubset(scene, material);

        expect(spyRemoveSubset).toHaveBeenCalledWith(11, scene, material);
    });

    test('removeSubset: without material and scene', () => {

        const spyRemoveSubset = jest.spyOn(ifcManager, 'removeSubset').mockImplementation();

        ifcModel.removeSubset();

        expect(spyRemoveSubset).toHaveBeenCalledWith(12, undefined, undefined);
    });

    test('createSubset', () => {

        const spyCreateSubset = jest.spyOn(ifcManager, 'createSubset').mockReturnValue(new Mesh());

        const scene = new Scene();
        const material = new Material();

        let config: BaseSubsetConfig = {
            scene: scene,
            ids: [1,2,3,4],
            material: material,
            removePrevious: false,
        };

        const result = ifcModel.createSubset(config);

        expect(spyCreateSubset).toHaveBeenCalledWith({
            modelID: 13,
            scene: scene,
            ids: [1,2,3,4],
            material: material,
            removePrevious: false,
        });
        expect(result).toBeInstanceOf(Mesh);
    });
});
