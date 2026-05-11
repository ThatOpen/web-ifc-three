import { WebIfcHandler } from "../../../src/IFC/web-workers/handlers/WebIfcHandler";
import { WorkerActions, WorkerAPIs } from "../../../src/IFC/web-workers/BaseDefinitions";

describe("WebIfcHandler", () => {
    test("CreateIfcGuidToExpressIdMapping forwards the request to the web-ifc worker", async () => {
        const expected = new Map([["guid", 42]]);
        const handler = {
            requestID: 0,
            request: jest.fn().mockResolvedValue(expected)
        };
        const serializer = {};
        const webIfcHandler = new WebIfcHandler(handler as any, serializer as any);

        const result = await webIfcHandler.CreateIfcGuidToExpressIdMapping(7);

        expect(handler.request).toHaveBeenCalledWith(
            WorkerAPIs.webIfc,
            WorkerActions.CreateIfcGuidToExpressIdMapping,
            { modelID: 7 }
        );
        expect(result).toBe(expected);
    });
});
