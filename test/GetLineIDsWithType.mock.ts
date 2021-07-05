import * as WebIFC from "web-ifc";
import {IfcGloballyUniqueId, IfcOwnerHistory, IfcRelDefinesByProperties} from "web-ifc";

const mockedList = {
    10: {
        103090709: [25],
        4031249490: [29],
        4186316022: [94]
    }
}

export function mockAndSpyGetLineIDsWithType(api: WebIFC.IfcAPI) {
    return jest.spyOn(api, 'GetLineIDsWithType')
        .mockImplementation((modelID: number, type: number) => {
            return {get: ((index: number) => mockedList[modelID][type][index]), size: () => mockedList[modelID][type]?.length || 0}
        });
}
