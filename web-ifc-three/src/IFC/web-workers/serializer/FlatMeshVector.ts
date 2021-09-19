import { SerializedVector } from '../BaseDefinitions';
import { FlatMesh as WebIfcFlatMesh, Vector as WebIfcVector } from 'web-ifc';
import { Serializer } from './Serializer';

export class FlatMeshVector implements WebIfcVector<WebIfcFlatMesh> {
    private readonly _size: number;
    private _data: { [key: number]: WebIfcFlatMesh } = {};

    constructor(serializer: Serializer, vector: SerializedVector) {
        this._size = vector.size;
        const keys = Object.keys(vector).filter((key) => key.indexOf('size') === -1).map(key => parseInt(key));
        keys.forEach(key => this._data[key] = serializer.reconstructFlatMesh(vector[key]));
    }

    size() {
        return this._size;
    }

    get(index: number) {
        return this._data[index];
    }
}