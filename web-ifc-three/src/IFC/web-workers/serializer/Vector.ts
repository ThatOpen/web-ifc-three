import { SerializedVector } from '../BaseDefinitions';
import { Vector as WebIfcVector } from 'web-ifc';

export class Vector<T> implements WebIfcVector<T> {
    private readonly _size: number;
    private _data: { [key: number]: T } = {};

    constructor(vector: SerializedVector) {
        this._size = vector.size;
        const keys = Object.keys(vector).filter((key) => key.indexOf('size') === -1).map(key => parseInt(key));
        keys.forEach((key) => this._data[key] = vector[key]);
    }

    size() {
        return this._size;
    }

    get(index: number) {
        return this._data[index];
    }
}