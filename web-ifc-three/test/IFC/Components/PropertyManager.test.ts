import {PropertyManager} from "../../../src/IFC/components/properties/PropertyManager";
import {BufferAttribute, BufferGeometry} from "three";
import * as WebIFC from "web-ifc";
import {Handle, IfcGloballyUniqueId, IfcPropertySet, IfcRelDefinesByProperties, IfcWall} from "web-ifc";
import {IdAttrName} from "../../../src/IFC/BaseDefinitions";
import {mockAndSpyGetLineIDsWithType} from "../../GetLineIDsWithType.mock";

describe("PropertyManager", () => {

    let propertyManager: PropertyManager;
    let ifcAPI: WebIFC.IfcAPI;

    beforeEach(() => {
        ifcAPI = new WebIFC.IfcAPI();
        propertyManager = new PropertyManager({models: {}, api: ifcAPI});
    })

    test('getExpressId: if has bufferGeometry no index then return nothing', () => {

        let bufferGeometry = new BufferGeometry();

        const result = propertyManager.getExpressId(bufferGeometry, 10);

        expect(result).toBe(undefined);
    });

    test('getExpressId: return express id', () => {

        let bufferGeometry = new BufferGeometry();
        bufferGeometry.setIndex(new BufferAttribute(new Uint32Array([1, 2, 3, 4]), 3));

        const expressIdAttribute = new BufferAttribute(new Uint32Array(), 0);
        bufferGeometry.setAttribute(IdAttrName, expressIdAttribute);

        const spyOnExpressIdAttributeGetX = jest.spyOn(expressIdAttribute, 'getX').mockReturnValue(10);

        const result = propertyManager.getExpressId(bufferGeometry, 1);

        expect(spyOnExpressIdAttributeGetX).toHaveBeenCalledWith(4);
        expect(result).toBe(10);
    });

    test('getItemProperties', () => {

        const spyGetLine = jest.spyOn(ifcAPI, 'GetLine').mockImplementation();

        propertyManager.getItemProperties(10, 5, false);

        expect(spyGetLine).toHaveBeenCalledWith(10, 5, false);
    });

    test('getAllItemsOfType: verbose is false', () => {


        const spyGetLine            = jest.spyOn(ifcAPI, 'GetLine').mockImplementation();
        const spyGetLineIDsWithType = mockAndSpyGetLineIDsWithType(ifcAPI);

        const result = propertyManager.getAllItemsOfType(10, 4031249490, false);

        expect(spyGetLineIDsWithType).toHaveBeenCalledWith(10, 4031249490);
        expect(spyGetLine).not.toHaveBeenCalled();
        expect(result).toEqual([29]);
    });

    test('getAllItemsOfType: verbose is true', () => {

        const spyGetLine            = jest.spyOn(ifcAPI, 'GetLine').mockReturnValue(100);
        const spyGetLineIDsWithType = mockAndSpyGetLineIDsWithType(ifcAPI);

        const result = propertyManager.getAllItemsOfType(10, 4031249490, true);

        expect(spyGetLineIDsWithType).toHaveBeenCalledWith(10, 4031249490);
        expect(spyGetLine).toHaveBeenCalledWith(10, 29);
        expect(result).toEqual([100]);
    });

    test('getPropertySets', () => {

        const targetPropertySet = new IfcPropertySet(
            100, 5, new IfcGloballyUniqueId('unique100'),
            null, null, null,
            [],
        );

        const spyGetLine            = jest.spyOn(ifcAPI, 'GetLine')
            .mockImplementation((modelID: number, expressID: number, flatten?: boolean) => {
                const mockedRelationList =  {
                    10: {
                        94: new IfcRelDefinesByProperties(
                            94, 4186316022, new IfcGloballyUniqueId('unique94'),
                            null, null, null,
                            [new Handle(74)],
                            new Handle(100),
                        ),
                        74: new IfcRelDefinesByProperties(
                            74, 5, new IfcGloballyUniqueId('unique74'),
                            null, null, null, [],
                            new Handle(10),
                        ),
                        100: targetPropertySet,
                    }
                }

                return mockedRelationList[modelID][expressID];
            });

        const spyGetLineIDsWithType = mockAndSpyGetLineIDsWithType(ifcAPI);

        const result = propertyManager.getPropertySets(10, 74, false);

        expect(result).toEqual([targetPropertySet])
    });

    test('getTypeProperties', () => {
        const targetPropertyType = new IfcWall(
            100, 5, new IfcGloballyUniqueId('unique100'),
            null, null, null, null, null, null, null, null
        );

        const spyGetLine            = jest.spyOn(ifcAPI, 'GetLine')
            .mockImplementation((modelID: number, expressID: number, flatten?: boolean) => {
                const mockedRelationList =  {
                    10: {
                        94: new IfcRelDefinesByProperties(
                            94, 4186316022, new IfcGloballyUniqueId('unique94'),
                            null, null, null,
                            [new Handle(74)],
                            new Handle(100),
                        ),
                        74: new IfcRelDefinesByProperties(
                            74, 5, new IfcGloballyUniqueId('unique74'),
                            null, null, null, [],
                            new Handle(10),
                        ),
                        100: targetPropertyType,
                    }
                }

                return mockedRelationList[modelID][expressID];
            });

        const spyGetLineIDsWithType = mockAndSpyGetLineIDsWithType(ifcAPI);

        const result = propertyManager.getPropertySets(10, 74, false);

        expect(result).toEqual([targetPropertyType])
    });

    test('getSpatialStructure', () => {
        // ToDo
    });
})
