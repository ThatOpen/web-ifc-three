import {PropertyManager} from "./PropertyManager";
import {BufferAttribute, BufferGeometry} from "three";
import * as WebIFC from "web-ifc";
import {IdAttrName} from "../BaseDefinitions";
import {mockAndSpyGetLineIDsWithType} from "../../../test/GetLineIDsWithType.mock";

describe("PropertyManager", () => {

    test('getExpressId: if has bufferGeometry no index then return nothing', () => {

        let bufferGeometry = new BufferGeometry();

        let propertyManager = new PropertyManager({models: {}, api: new WebIFC.IfcAPI()});

        const result = propertyManager.getExpressId(bufferGeometry, 10);

        expect(result).toBe(undefined);
    });

    test('getExpressId: return express id', () => {

        let bufferGeometry = new BufferGeometry();
        bufferGeometry.setIndex(new BufferAttribute(new Uint32Array([1, 2, 3, 4]), 3));

        const expressIdAttribute = new BufferAttribute(new Uint32Array(), 0);
        bufferGeometry.setAttribute(IdAttrName, expressIdAttribute);

        const spyOnExpressIdAttributeGetX = jest.spyOn(expressIdAttribute, 'getX').mockReturnValue(10);


        let propertyManager = new PropertyManager({models: {}, api: new WebIFC.IfcAPI()});

        const result = propertyManager.getExpressId(bufferGeometry, 1);

        expect(spyOnExpressIdAttributeGetX).toHaveBeenCalledWith(4);
        expect(result).toBe(10);
    });

    test('getItemProperties', () => {

        const api = new WebIFC.IfcAPI();
        const spyGetLine = jest.spyOn(api, 'GetLine').mockImplementation();

        let propertyManager = new PropertyManager({models: {}, api: api});
        propertyManager.getItemProperties(10, 5, false);

        expect(spyGetLine).toHaveBeenCalledWith(10, 5, false);
    });

    test('getAllItemsOfType: verbose is false', () => {

        const api = new WebIFC.IfcAPI();
        const spyGetLine            = jest.spyOn(api, 'GetLine').mockImplementation();

        const spyGetLineIDsWithType = mockAndSpyGetLineIDsWithType(api);

        let propertyManager = new PropertyManager({models: {}, api: api});
        const result = propertyManager.getAllItemsOfType(10, 4031249490, false);

        expect(spyGetLineIDsWithType).toHaveBeenCalledWith(10, 4031249490);
        expect(spyGetLine).not.toHaveBeenCalled();
        expect(result).toEqual([29]);
    });

    test('getAllItemsOfType: verbose is true', () => {

        const api = new WebIFC.IfcAPI();
        const spyGetLine            = jest.spyOn(api, 'GetLine').mockReturnValue(100);

        const spyGetLineIDsWithType = mockAndSpyGetLineIDsWithType(api);

        let propertyManager = new PropertyManager({models: {}, api: api});
        const result = propertyManager.getAllItemsOfType(10, 4031249490, true);

        expect(spyGetLineIDsWithType).toHaveBeenCalledWith(10, 4031249490);
        expect(spyGetLine).toHaveBeenCalledWith(10, 29);
        expect(result).toEqual([100]);
    });

})
