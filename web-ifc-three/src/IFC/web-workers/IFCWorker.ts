import { IfcAPI } from 'web-ifc';
import { IfcEventData, WebIfcWorker } from './BaseDefinitions';
import { Serializer } from './serializer/Serializer';

class IFCWorker implements WebIfcWorker {
    private readonly serializer = new Serializer();
    webIFC: IfcAPI;

    constructor() {
        this.webIFC = new IfcAPI();
    }

    async Init(data: IfcEventData) {
        await this.webIFC.Init();
        IFCWorker.post(data);
    };

    Close(data: IfcEventData) {
        this.nullifyWebIfc();
        IFCWorker.post(data);
    };

    CloseModel(data: IfcEventData) {
        this.webIFC.CloseModel(data.args.modelID);
        IFCWorker.post(data);
    }

    CreateModel(data: IfcEventData) {
        data.result = this.webIFC.CreateModel(data.args.settings);
        IFCWorker.post(data);
    }

    ExportFileAsIFC(data: IfcEventData) {
        data.result = this.webIFC.ExportFileAsIFC(data.args.modelID);
        IFCWorker.post(data);
    }

    FlattenLine(data: IfcEventData) {
        this.webIFC.FlattenLine(data.args.modelID, data.args.line);
        IFCWorker.post(data);
    }

    GetAllLines(data: IfcEventData) {
        const vector = this.webIFC.GetAllLines(data.args.modelID);
        data.result = this.serializer.serializeVector(vector);
        IFCWorker.post(data);
    }

    GetAndClearErrors(data: IfcEventData) {
        const vector = this.webIFC.GetAndClearErrors(data.args.modelID);
        data.result = this.serializer.serializeVector(vector);
        IFCWorker.post(data);
    }

    GetCoordinationMatrix(data: IfcEventData) {
        data.result = this.webIFC.GetCoordinationMatrix(data.args.modelID);
        IFCWorker.post(data);
    }

    GetFlatMesh(data: IfcEventData) {
        const flatMesh = this.webIFC.GetFlatMesh(data.args.modelID, data.args.expressID);
        data.result = this.serializer.serializeFlatMesh(flatMesh);
        IFCWorker.post(data);
    }

    GetGeometry(data: IfcEventData) {
        const ifcGeometry = this.webIFC.GetGeometry(data.args.modelID, data.args.geometryExpressID);
        data.result = this.serializer.serializeIfcGeometry(ifcGeometry);
        IFCWorker.post(data);
    }

    GetIndexArray(data: IfcEventData) {
        data.result = this.webIFC.GetIndexArray(data.args.ptr, data.args.size);
        IFCWorker.post(data);
    }

    GetLine(data: IfcEventData) {
        const args = data.args;
        data.result = this.webIFC.GetLine(args.modelID, args.expressID, args.flatten);
        IFCWorker.post(data);
    }

    GetLineIDsWithType(data: IfcEventData) {
        const vector = this.webIFC.GetLineIDsWithType(data.args.modelID, data.args.type);
        data.result = this.serializer.serializeVector(vector);
        IFCWorker.post(data);
    }

    GetRawLineData(data: IfcEventData) {
        data.result = this.webIFC.GetRawLineData(data.args.modelID, data.args.expressID);
        IFCWorker.post(data);
    }

    GetVertexArray(data: IfcEventData) {
        data.result = this.webIFC.GetVertexArray(data.args.ptr, data.args.size);
        IFCWorker.post(data);
    }

    IsModelOpen(data: IfcEventData) {
        data.result = this.webIFC.IsModelOpen(data.args.modelID);
        IFCWorker.post(data);
    }

    LoadAllGeometry(data: IfcEventData) {
        const flatMeshVector = this.webIFC.LoadAllGeometry(data.args.modelID);
        data.result = this.serializer.serializeFlatMeshVector(flatMeshVector);
        IFCWorker.post(data);
    }

    OpenModel(data: IfcEventData) {
        data.result = this.webIFC.OpenModel(data.args.data, data.args.settigs);
        IFCWorker.post(data);
    }

    SetGeometryTransformation(data: IfcEventData) {
        this.webIFC.SetGeometryTransformation(data.args.modelID, data.args.transformationMatrix);
        IFCWorker.post(data);
    }

    SetWasmPath(data: IfcEventData) {
        this.webIFC.SetWasmPath(data.args.path);
        IFCWorker.post(data);
    }

    StreamAllMeshes(data: IfcEventData) {
        const serializer = this.serializer.serializeFlatMesh;
        const callback = (result: any) => IFCWorker.postCallback(data, result, serializer);
        this.webIFC.StreamAllMeshes(data.args.modelID, callback);
    }

    StreamAllMeshesWithTypes(data: IfcEventData) {
        const args = data.args;
        const serializer = this.serializer.serializeFlatMesh;
        const callback = (result: any) => IFCWorker.postCallback(data, result, serializer);
        this.webIFC.StreamAllMeshesWithTypes(args.modelID, args.types, callback);
    }

    WriteLine(data: IfcEventData) {
        this.webIFC.WriteLine(data.args.modelID, data.args.lineObject);
        IFCWorker.post(data);
    }

    WriteRawLineData(data: IfcEventData) {
        this.webIFC.WriteRawLineData(data.args.modelID, data.args.data);
        IFCWorker.post(data);
    }

    getSubArray(data: IfcEventData) {
        const args = data.args;
        this.webIFC.getSubArray(args.heap, args.startPtr, args.sizeBytes);
        IFCWorker.post(data);
    }

    private static post(data: any) {
        // @ts-ignore
        self.postMessage(data);
    }

    private static postCallback(data: any, result: any, serializer?: any) {
        data.result = serializer ? serializer(result) : result;
        IFCWorker.post(data);
    }

    private nullifyWebIfc() {
        // @ts-ignore
        this.webIFC = null;
    }
}

const worker = new IFCWorker();

self.onmessage = async (event: MessageEvent) => {
    const data = event.data as IfcEventData;
    const action = data.action;

    if (!worker[action]) {
        throw new Error(`The action ${action} does not exist in the IFC worker`);
    }

    await worker[action](data);
};