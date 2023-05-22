import { IfcEventData, IfcWorkerAPI, WebIfcWorkerAPI, WorkerAPIs } from '../BaseDefinitions';
import { IfcAPI } from 'web-ifc';
import { Serializer } from '../serializer/Serializer';

export class WebIfcWorker implements WebIfcWorkerAPI {

    webIFC: IfcAPI;
    API = WorkerAPIs.webIfc;

    constructor(private worker: IfcWorkerAPI, private serializer: Serializer) {
        this.webIFC = new IfcAPI();
        this.worker.initializeAPI(this.webIFC);
    }

    async Init(data: IfcEventData) {
        await this.webIFC.Init();
        this.worker.post(data);
    };

    async Close(data: IfcEventData) {
        this.nullifyWebIfc();
        this.webIFC = new IfcAPI();
        await this.webIFC.Init();
        this.worker.post(data);
    };

    async DisposeWebIfc(data: IfcEventData) {
        this.nullifyWebIfc();
        this.worker.post(data);
    }

    CloseModel(data: IfcEventData) {
        this.webIFC.CloseModel(data.args.modelID);
        this.worker.post(data);
    }

    CreateModel(data: IfcEventData) {
        data.result = this.webIFC.CreateModel(data.args.settings);
        this.worker.post(data);
    }

    ExportFileAsIFC(data: IfcEventData) {
        data.result = this.webIFC.ExportFileAsIFC(data.args.modelID);
        this.worker.post(data);
    }

    FlattenLine(data: IfcEventData) {
        this.webIFC.FlattenLine(data.args.modelID, data.args.line);
        this.worker.post(data);
    }

    GetAllLines(data: IfcEventData) {
        const vector = this.webIFC.GetAllLines(data.args.modelID);
        data.result = this.serializer.serializeVector(vector);
        this.worker.post(data);
    }

    GetAndClearErrors(data: IfcEventData) {
        const vector = this.webIFC.GetAndClearErrors(data.args.modelID);
        data.result = this.serializer.serializeVector(vector);
        this.worker.post(data);
    }

    GetCoordinationMatrix(data: IfcEventData) {
        data.result = this.webIFC.GetCoordinationMatrix(data.args.modelID);
        this.worker.post(data);
    }

    GetFlatMesh(data: IfcEventData) {
        const flatMesh = this.webIFC.GetFlatMesh(data.args.modelID, data.args.expressID);
        data.result = this.serializer.serializeFlatMesh(flatMesh);
        this.worker.post(data);
    }

    GetGeometry(data: IfcEventData) {
        const ifcGeometry = this.webIFC.GetGeometry(data.args.modelID, data.args.geometryExpressID);
        data.result = this.serializer.serializeIfcGeometry(ifcGeometry);
        this.worker.post(data);
    }

    GetIndexArray(data: IfcEventData) {
        data.result = this.webIFC.GetIndexArray(data.args.ptr, data.args.size);
        this.worker.post(data);
    }

    GetLine(data: IfcEventData) {
        const args = data.args;
        try {
           data.result = this.webIFC.GetLine(args.modelID, args.expressID, args.flatten);
        } catch (e) {
            console.log(`There was a problem getting the properties of the item ${args.expressID}`);
            data.result = {};
        }
        this.worker.post(data);
    }

    GetLineIDsWithType(data: IfcEventData) {
        const vector = this.webIFC.GetLineIDsWithType(data.args.modelID, data.args.type);
        data.result = this.serializer.serializeVector(vector);
        this.worker.post(data);
    }

    GetRawLineData(data: IfcEventData) {
        data.result = this.webIFC.GetRawLineData(data.args.modelID, data.args.expressID);
        this.worker.post(data);
    }

    GetVertexArray(data: IfcEventData) {
        data.result = this.webIFC.GetVertexArray(data.args.ptr, data.args.size);
        this.worker.post(data);
    }

    IsModelOpen(data: IfcEventData) {
        data.result = this.webIFC.IsModelOpen(data.args.modelID);
        this.worker.post(data);
    }

    LoadAllGeometry(data: IfcEventData) {
        const flatMeshVector = this.webIFC.LoadAllGeometry(data.args.modelID);
        data.result = this.serializer.serializeFlatMeshVector(flatMeshVector);
        this.worker.post(data);
    }

    OpenModel(data: IfcEventData) {
        data.result = this.webIFC.OpenModel(data.args.data, data.args.settings);
        this.worker.post(data);
    }

    SetGeometryTransformation(data: IfcEventData) {
        this.webIFC.SetGeometryTransformation(data.args.modelID, data.args.transformationMatrix);
        this.worker.post(data);
    }

    SetWasmPath(data: IfcEventData) {
        this.webIFC.SetWasmPath(data.args.path);
        this.worker.post(data);
    }

    StreamAllMeshes(data: IfcEventData) {
        const serializer = this.serializer.serializeFlatMesh;
        const callback = (result: any) => this.worker.postCallback(data, result, serializer);
        this.webIFC.StreamAllMeshes(data.args.modelID, callback);
    }

    StreamAllMeshesWithTypes(data: IfcEventData) {
        const args = data.args;
        const serializer = this.serializer.serializeFlatMesh;
        const callback = (result: any) => this.worker.postCallback(data, result, serializer);
        this.webIFC.StreamAllMeshesWithTypes(args.modelID, args.types, callback);
    }

    WriteLine(data: IfcEventData) {
        const modelID = data.args.modelID;
        const serializedObject = data.args.lineObject;

        // This is necessary because of the serialization of the web worker
        const object = this.webIFC.GetLine(modelID, serializedObject.expressID);
        Object.keys(serializedObject).forEach(propName => {
            if(object[propName] !== undefined) {
                object[propName] = serializedObject[propName];
            }
        })

        this.webIFC.WriteLine(data.args.modelID, object);
        this.worker.post(data);
    }

    WriteRawLineData(data: IfcEventData) {
        this.webIFC.WriteRawLineData(data.args.modelID, data.args.data);
        this.worker.post(data);
    }

    getSubArray(data: IfcEventData) {
        const args = data.args;
        this.webIFC.getSubArray(args.heap, args.startPtr, args.sizeBytes);
        this.worker.post(data);
    }

    GetNameFromTypeCode(data: IfcEventData) {
        data.result=this.webIFC.GetNameFromTypeCode(data.args.modelID);
        this.worker.post(data);
    }

    GetIfcEntityList(data: IfcEventData) {
        data.result=this.webIFC.GetIfcEntityList(data.args.modelID);
        this.worker.post(data);
    }

    GetTypeCodeFromName(data: IfcEventData) {
        data.result=this.webIFC.GetTypeCodeFromName(data.args.typeName);
        this.worker.post(data);
    }

    private nullifyWebIfc() {
        // @ts-ignore
        this.webIFC = null;
    }
}