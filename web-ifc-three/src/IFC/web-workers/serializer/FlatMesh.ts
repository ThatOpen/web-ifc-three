import { SerializedFlatMesh } from '../BaseDefinitions';
import { FlatMesh as WebIfcFlatMesh, PlacedGeometry } from 'web-ifc';
import { Vector } from './Vector';
import { Serializer } from './Serializer';

export class FlatMesh implements WebIfcFlatMesh {
    geometries: Vector<PlacedGeometry>;
    expressID: number;

    constructor(serializer: Serializer, flatMesh: SerializedFlatMesh) {
        this.expressID = flatMesh.expressID;
        this.geometries = serializer.reconstructVector(flatMesh.geometries);
    }
}