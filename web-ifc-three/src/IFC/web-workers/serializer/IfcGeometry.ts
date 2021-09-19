import { SerializedIfcGeometry } from '../BaseDefinitions';
import { IfcGeometry as WebIfcIfcGeometry } from 'web-ifc';

export class IfcGeometry implements WebIfcIfcGeometry {
    private readonly _GetVertexData: number;
    private readonly _GetVertexDataSize: number;
    private readonly _GetIndexData: number;
    private readonly _GetIndexDataSize: number;

    constructor(vector: SerializedIfcGeometry) {
        this._GetVertexData = vector.GetVertexData;
        this._GetVertexDataSize = vector.GetVertexDataSize;
        this._GetIndexData = vector.GetIndexData;
        this._GetIndexDataSize = vector.GetIndexDataSize;
    }

    GetVertexData() {
        return this._GetVertexData;
    }

    GetVertexDataSize() {
        return this._GetVertexDataSize;
    }

    GetIndexData() {
        return this._GetIndexData;
    }

    GetIndexDataSize() {
        return this._GetIndexDataSize;
    }
}