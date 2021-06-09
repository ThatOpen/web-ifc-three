import { BufferGeometry, Material, Mesh } from 'three';
import { IfcAPI } from 'web-ifc';

export const VertexProps = {
    r: 'red',
    g: 'green',
    b: 'blue',
    a: 'alfa',
    h: 'highlighted'
};

export interface Display {
    r: number;
    g: number;
    b: number;
    a: number;
    h: -1 | 0 | 1;
}

export type MapFaceIndexID = { [key: number]: number };
export type MapIDFaceIndex = { [key: number]: number[] };

export interface IfcModel {
    modelID: number;
    ids: MapFaceIndexID;
    faces: MapIDFaceIndex;
    mesh: IfcMesh;
}

export interface IfcState {
    models: { [modelID: number]: IfcModel };
    api: IfcAPI;
}

export interface IfcMesh extends Mesh {
    modelID: number;
}

export interface TransparentMesh extends IfcMesh {
    transparentMesh: Mesh;
}

// export interface IfcSelection {
//     items: number[],
//     modelID: number;
// }

export type GeometryByMaterial = {
    material: Material;
    geometry: BufferGeometry[];
    indices: { [keys: number]: number };
    lastIndex: number;
};

export interface GeometriesByMaterial {
    [key: string]: GeometryByMaterial;
}

export interface Item {
    expressID: number;
    hasSpatialChildren: Item[];
    hasChildren: Item[];
}
