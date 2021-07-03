import {PropertyManager} from "./PropertyManager";
import {BufferAttribute, BufferGeometry} from "three";
import * as WebIFC from "web-ifc";
import {IdAttrName} from "../BaseDefinitions";
import {mockAndSpyGetLineIDsWithType} from "../../../test/GetLineIDsWithType.mock";

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

})
