import { BufferGeometry, Material, Mesh } from "three";
export declare const VertexProps: {
    r: string;
    g: string;
    b: string;
    a: string;
    h: string;
};
export interface Display {
    r: number;
    g: number;
    b: number;
    a: number;
    h: 0 | 1;
}
export interface TransparentMesh extends Mesh {
    transparentMesh: Mesh;
}
export declare type GeometryByMaterial = {
    material: Material;
    geometry: BufferGeometry[];
    indices: {
        [keys: number]: number;
    };
    lastIndex: number;
};
export interface GeometriesByMaterial {
    [key: string]: GeometryByMaterial;
}
export declare type MapFaceIndexID = {
    [key: number]: number;
};
export declare type MapIDFaceIndex = {
    [key: number]: number[];
};
