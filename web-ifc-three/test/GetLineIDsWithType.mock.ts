import * as WebIFC from "web-ifc";
import {VectorMock} from "./Vector.mock";

const mockedList = {
    10: {
        103090709: new VectorMock<number>([25]),
        4031249490: new VectorMock<number>([29]),
        4186316022: new VectorMock<number>([94])
    }
}

export function mockAndSpyGetLineIDsWithType(api: WebIFC.IfcAPI) {
    return jest.spyOn(api, 'GetLineIDsWithType')
        .mockImplementation((modelID: number, type: number) => {
            return mockedList[modelID][type] || new VectorMock<number>([]);
        });
}
