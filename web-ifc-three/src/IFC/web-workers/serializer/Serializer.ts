import { Vector as WebIfcVector, IfcGeometry as WebIfcIfcGeometry, FlatMesh as WebIfcFlatMesh } from 'web-ifc';
import { SerializedFlatMesh, SerializedIfcGeometry, SerializedVector } from '../BaseDefinitions';
import { Vector } from './Vector';
import { IfcGeometry } from './IfcGeometry';
import { FlatMesh } from './FlatMesh';
import { FlatMeshVector } from './FlatMeshVector';
import { IFCModel } from '../../components/IFCModel';
import { MeshReconstructor, SerializedMesh } from './Mesh';

export class Serializer {

    serializeVector<T>(vector: WebIfcVector<T>) {
        const size = vector.size();
        const serialized: SerializedVector = { size };
        for (let i = 0; i < size; i++) {
            serialized[i] = vector.get(i);
        }
        return serialized;
    }

    reconstructVector(vector: SerializedVector): Vector<any> {
        return new Vector(vector);
    }

    serializeIfcGeometry(geometry: WebIfcIfcGeometry) {
        const GetVertexData = geometry.GetVertexData();
        const GetVertexDataSize = geometry.GetVertexDataSize();
        const GetIndexData = geometry.GetIndexData();
        const GetIndexDataSize = geometry.GetIndexDataSize();
        return {
            GetVertexData,
            GetVertexDataSize,
            GetIndexData,
            GetIndexDataSize
        } as SerializedIfcGeometry;
    }

    reconstructIfcGeometry(geometry: SerializedIfcGeometry) {
        return new IfcGeometry(geometry);
    }

    serializeFlatMesh(flatMesh: WebIfcFlatMesh) {
        return {
            expressID: flatMesh.expressID,
            geometries: this.serializeVector(flatMesh.geometries)
        } as SerializedFlatMesh;
    }

    reconstructFlatMesh(flatMesh: SerializedFlatMesh) {
        return new FlatMesh(this, flatMesh);
    }

    serializeFlatMeshVector(vector: WebIfcVector<WebIfcFlatMesh>) {
        const size = vector.size();
        const serialized: SerializedVector = { size };
        for (let i = 0; i < size; i++) {
            const flatMesh = vector.get(i);
            serialized[i] = this.serializeFlatMesh(flatMesh);
        }
        return serialized;
    }

    reconstructFlatMeshVector(vector: SerializedVector): WebIfcVector<WebIfcFlatMesh> {
        return new FlatMeshVector(this, vector);
    }

    serializeIfcModel(model: IFCModel) {
        return new SerializedMesh(model);
    }

    reconstructIfcModel(model: SerializedMesh) {
        return MeshReconstructor.new(model);
    }
}