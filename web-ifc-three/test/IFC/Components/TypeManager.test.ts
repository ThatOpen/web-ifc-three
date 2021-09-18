import {TypeManager} from "../../../src/IFC/components/TypeManager";
import {IfcAPI} from "web-ifc";
import {IfcState} from "../../../src/IFC/BaseDefinitions";
import {mockAndSpyGetLineIDsWithType} from "../../GetLineIDsWithType.mock";

jest.mock('web-ifc');

describe("TypeManager", () => {

    let ifcAPI: IfcAPI

    beforeEach(() => {
        ifcAPI = new IfcAPI();
    });

    test('getAllTypes: if model list empty do nothing', () => {

        const state: IfcState = {
            models: {},
            api: ifcAPI
        }

        let typeManger = new TypeManager(state);
        jest.spyOn(typeManger, 'getAllTypesOfModel');

        typeManger.getAllTypes();

        expect(typeManger.getAllTypesOfModel).not.toHaveBeenCalled();
    });

    test('getAllTypes: if exists a model with no type then call getAllTypesOfModel', () => {

        const state: IfcState = {
            models: {
                0: {modelID: 0, types: {25: 103090709}, mesh: null, items: {}},
                1: {modelID: 1, types: {}, mesh: null, items: {}}
            },
            api: ifcAPI
        }

        let typeManger = new TypeManager(state);
        jest.spyOn(typeManger, 'getAllTypesOfModel').mockImplementation();

        typeManger.getAllTypes();

        expect(typeManger.getAllTypesOfModel).toHaveBeenCalledTimes(1);
        expect(typeManger.getAllTypesOfModel).toHaveBeenCalledWith(1);
    });

    test('getAllTypesOfModel: with found types over GetLineIDsWithType', () => {

        const state: IfcState = {
            models: {
                10: {modelID: 10, types: {}, mesh: null, items: {}}
            },
            api: ifcAPI
        }

        let typeManger = new TypeManager(state);

        mockAndSpyGetLineIDsWithType(ifcAPI);

        typeManger.getAllTypesOfModel(10);

        expect(state.models[10]).toEqual({
            items: {},
            mesh: null,
            modelID: 10,
            types: {
                25: 103090709,
                29: 4031249490
            }
        })
    });
});

