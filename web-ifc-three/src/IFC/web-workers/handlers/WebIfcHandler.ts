import { WebIfcAPI } from '../../BaseDefinitions';
import {
    
    SerializedFlatMesh,
    SerializedIfcGeometry,
    SerializedVector,
    WorkerActions,
    WorkerAPIs
} from '../BaseDefinitions';

import { NewIfcModel, FlatMesh, IfcGeometry, LoaderError, LoaderSettings, RawLineData, Vector } from 'web-ifc';
import { IFCWorkerHandler } from '../IFCWorkerHandler';
import { Serializer } from '../serializer/Serializer';

export class WebIfcHandler implements WebIfcAPI {

    wasmModule: any;
    API = WorkerAPIs.webIfc;

    constructor(private handler: IFCWorkerHandler, private serializer: Serializer) {
    }

    async Init(): Promise<void> {
        this.wasmModule = true;
        return this.handler.request(this.API, WorkerActions.Init);
    }

    async OpenModel(data:  string | Uint8Array, settings?: LoaderSettings): Promise<number> {
        return this.handler.request(this.API, WorkerActions.OpenModel, { data, settings });
    }

    async CreateModel(model: NewIfcModel, settings?: LoaderSettings): Promise<number> {
        return this.handler.request(this.API, WorkerActions.CreateModel, { model, settings });
    }

    async ExportFileAsIFC(modelID: number): Promise<Uint8Array> {
        return this.handler.request(this.API, WorkerActions.ExportFileAsIFC, { modelID });
    }

    async GetHeaderLine(modelID: number, headerType: number): Promise<any> {
        return this.handler.request(this.API, WorkerActions.getHeaderLine, { modelID, headerType });
    }

    async GetGeometry(modelID: number, geometryExpressID: number): Promise<IfcGeometry> {
        this.handler.serializeHandlers[this.handler.requestID] = (geom: SerializedIfcGeometry) => {
            return this.serializer.reconstructIfcGeometry(geom);
        }
        return this.handler.request(this.API, WorkerActions.GetGeometry, { modelID, geometryExpressID });
    }

    async GetLine(modelID: number, expressID: number, flatten?: boolean): Promise<any> {
        return this.handler.request(this.API, WorkerActions.GetLine, { modelID, expressID, flatten });
    }

    async GetAndClearErrors(modelID: number): Promise<Vector<LoaderError>> {
        this.handler.serializeHandlers[this.handler.requestID] = (vector: SerializedVector) => {
            return this.serializer.reconstructVector(vector);
        }
        return this.handler.request(this.API, WorkerActions.GetAndClearErrors, { modelID });
    }

    async GetNameFromTypeCode(type:number): Promise<string> {
        return this.handler.request(this.API, WorkerActions.GetNameFromTypeCode, { type });
    } 

    async GetIfcEntityList(modelID: number) : Promise<number[]> {
        return this.handler.request(this.API, WorkerActions.GetIfcEntityList, { modelID });
    }

    async GetTypeCodeFromName(typeName:string): Promise<number> {
         return this.handler.request(this.API, WorkerActions.GetTypeCodeFromName, { typeName });
    }

    async WriteLine(modelID: number, lineObject: any): Promise<void> {
        return this.handler.request(this.API, WorkerActions.WriteLine, { modelID, lineObject });
    }

    async FlattenLine(modelID: number, line: any): Promise<void> {
        return this.handler.request(this.API, WorkerActions.FlattenLine, { modelID, line });
    }

    async GetRawLineData(modelID: number, expressID: number): Promise<RawLineData> {
        return this.handler.request(this.API, WorkerActions.GetRawLineData, { modelID, expressID });
    }

    async WriteRawLineData(modelID: number, data: RawLineData): Promise<any> {
        return this.handler.request(this.API, WorkerActions.WriteRawLineData, { modelID, data });
    }

    async GetLineIDsWithType(modelID: number, type: number): Promise<Vector<number>> {
        this.handler.serializeHandlers[this.handler.requestID] = (vector: SerializedVector) => {
            return this.serializer.reconstructVector(vector);
        }
        return this.handler.request(this.API, WorkerActions.GetLineIDsWithType, { modelID, type });
    }

    async GetAllLines(modelID: number): Promise<Vector<number>> {
        this.handler.serializeHandlers[this.handler.requestID] = (vector: SerializedVector) => {
            return this.serializer.reconstructVector(vector);
        }
        return this.handler.request(this.API, WorkerActions.GetAllLines, { modelID });
    }

    async SetGeometryTransformation(modelID: number, transformationMatrix: number[]): Promise<void> {
        return this.handler.request(this.API, WorkerActions.SetGeometryTransformation, {
            modelID,
            transformationMatrix
        });
    }

    async GetCoordinationMatrix(modelID: number): Promise<number[]> {
        return this.handler.request(this.API, WorkerActions.GetCoordinationMatrix, { modelID });
    }

    async GetVertexArray(ptr: number, size: number): Promise<Float32Array> {
        return this.handler.request(this.API, WorkerActions.GetVertexArray, { ptr, size });
    }

    async GetIndexArray(ptr: number, size: number): Promise<Uint32Array> {
        return this.handler.request(this.API, WorkerActions.GetIndexArray, { ptr, size });
    }

    async getSubArray(heap: any, startPtr: any, sizeBytes: any): Promise<any> {
        return this.handler.request(this.API, WorkerActions.getSubArray, { heap, startPtr, sizeBytes });
    }

    async CloseModel(modelID: number): Promise<void> {
        return this.handler.request(this.API, WorkerActions.CloseModel, { modelID });
    }

    async StreamAllMeshes(modelID: number, meshCallback: (mesh: FlatMesh) => void): Promise<void> {
        this.handler.callbackHandlers[this.handler.requestID] = {
            action: meshCallback,
            serializer: this.serializer.reconstructFlatMesh
        };
        return this.handler.request(this.API, WorkerActions.StreamAllMeshes, { modelID });
    }

    async StreamAllMeshesWithTypes(modelID: number, types: number[], meshCallback: (mesh: FlatMesh) => void): Promise<void> {
        this.handler.callbackHandlers[this.handler.requestID] = {
            action: meshCallback,
            serializer: this.serializer.reconstructFlatMesh
        };
        return this.handler.request(this.API, WorkerActions.StreamAllMeshesWithTypes, { modelID, types });
    }

    async IsModelOpen(modelID: number): Promise<boolean> {
        return this.handler.request(this.API, WorkerActions.IsModelOpen, { modelID });
    }

    async LoadAllGeometry(modelID: number): Promise<Vector<FlatMesh>> {
        this.handler.serializeHandlers[this.handler.requestID] = (vector: SerializedVector) => {
            return this.serializer.reconstructFlatMeshVector(vector);
        }
        return this.handler.request(this.API, WorkerActions.LoadAllGeometry, { modelID });
    }

    async GetFlatMesh(modelID: number, expressID: number): Promise<FlatMesh> {
        this.handler.serializeHandlers[this.handler.requestID] = (flatMesh: SerializedFlatMesh) => {
            return this.serializer.reconstructFlatMesh(flatMesh);
        }
        return this.handler.request(this.API, WorkerActions.GetFlatMesh, { modelID, expressID });
    }

    async SetWasmPath(path: string): Promise<void> {
        return this.handler.request(this.API, WorkerActions.SetWasmPath, { path });
    }
}