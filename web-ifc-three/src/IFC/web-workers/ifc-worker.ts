import { IfcAPI } from 'web-ifc';
import { IfcEventData, WorkerActions, WebIfcWorker, IfcWorkerEventHandler } from './base-definitions-workers';

class IfcWorker implements WebIfcWorker {
    webIFC: IfcAPI | null = null;

    async Init(data: IfcEventData) {
        this.webIFC = null;
        this.webIFC = new IfcAPI();
        await this.webIFC.Init();
        IfcWorker.post(data);
    };

    Close(data: IfcEventData) {
        this.webIFC = null;
        IfcWorker.post(data);
    };

    CloseModel(data: IfcEventData) {
        this.webIFC.CloseModel(data.args.modelID);
        IfcWorker.post(data);
    }

    CreateModel(data: IfcEventData) {
        data.result = this.webIFC.CreateModel(data.args.settings);
        IfcWorker.post(data);
    }

    ExportFileAsIFC(data: IfcEventData) {
        data.result = this.webIFC.ExportFileAsIFC(data.args.modelID);
        IfcWorker.post(data);
    }

    FlattenLine(data: IfcEventData) {
        this.webIFC.FlattenLine(data.args.modelID, data.args.line);
        IfcWorker.post(data);
    }

    GetAllLines(data: IfcEventData) {
        data.result = this.webIFC.GetAllLines(data.args.modelID);
        IfcWorker.post(data);
    }

    GetAndClearErrors(data: IfcEventData) {
        data.result = this.webIFC.GetAndClearErrors(data.args.modelID);
        IfcWorker.post(data);
    }

    GetCoordinationMatrix(data: IfcEventData) {
        data.result = this.webIFC.GetCoordinationMatrix(data.args.modelID);
        IfcWorker.post(data);
    }

    GetFlatMesh(data: IfcEventData) {
        data.result = this.webIFC.GetFlatMesh(data.args.modelID, data.args.expressID);
        IfcWorker.post(data);
    }

    GetGeometry(data: IfcEventData) {
        data.result = this.webIFC.GetGeometry(data.args.modelID, data.args.geometryExpressID);
        IfcWorker.post(data);
    }

    GetIndexArray(data: IfcEventData) {
        data.result = this.webIFC.GetIndexArray(data.args.ptr, data.args.size);
        IfcWorker.post(data);
    }

    GetLine(data: IfcEventData) {
        const args = data.args;
        data.result = this.webIFC.GetLine(args.modelID, args.expressID, args.flatten);
        IfcWorker.post(data);
    }

    GetLineIDsWithType(data: IfcEventData) {
        data.result = this.webIFC.GetLineIDsWithType(data.args.modelID, data.args.type);
        IfcWorker.post(data);
    }

    GetRawLineData(data: IfcEventData) {
        data.result = this.webIFC.GetRawLineData(data.args.modelID, data.args.expressID);
        IfcWorker.post(data);
    }

    GetVertexArray(data: IfcEventData) {
        data.result = this.webIFC.GetVertexArray(data.args.ptr, data.args.size);
        IfcWorker.post(data);
    }

    IsModelOpen(data: IfcEventData) {
        data.result = this.webIFC.IsModelOpen(data.args.modelID);
        IfcWorker.post(data);
    }

    LoadAllGeometry(data: IfcEventData) {
        data.result = this.webIFC.LoadAllGeometry(data.args.modelID);
        IfcWorker.post(data);
    }

    OpenModel(data: IfcEventData) {
        data.result = this.webIFC.OpenModel(data.args.data, data.args.settigs);
        IfcWorker.post(data);
    }

    SetGeometryTransformation(data: IfcEventData) {
        this.webIFC.SetGeometryTransformation(data.args.modelID, data.args.transformationMatrix);
        IfcWorker.post(data);
    }

    SetWasmPath(data: IfcEventData) {
        this.webIFC.SetWasmPath(data.args.path);
        IfcWorker.post(data);
    }

    StreamAllMeshes(data: IfcEventData) {
        IfcWorker.post(data);
    }

    StreamAllMeshesWithTypes(data: IfcEventData) {
        IfcWorker.post(data);
    }

    WriteLine(data: IfcEventData) {
        IfcWorker.post(data);
    }

    WriteRawLineData(data: IfcEventData) {
        IfcWorker.post(data);
    }

    getSubArray(data: IfcEventData) {
        IfcWorker.post(data);
    }

    private static post(data: any) {
        // @ts-ignore
        self.postMessage(data);
    }
}

const worker = new IfcWorker();

self.onmessage = async (event: MessageEvent) => {
    const data = event.data as IfcEventData;
    const action = data.action;

    if (!worker[action]) {
        throw new Error(`The action ${action} does not exist in the IFC worker`);
    }

    await worker[action](data);
};