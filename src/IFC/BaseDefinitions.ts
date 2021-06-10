import { BufferGeometry, Material, Mesh } from 'three';
import { IfcAPI } from 'web-ifc';

export const IdAttr = 'expressID';

export type HighlightConfig = {
    material?: Material;
    removePrevious?: boolean;
};

export type MapFaceindexID = { [key: number]: number };

export type MaterialItem = { [matID: string]: { geom: BufferGeometry; mat: Material } };
export type IdMaterialItem = { [expressID: number]: MaterialItem };

export interface IfcModel {
    modelID: number;
    mesh: IfcMesh;
    items: IdMaterialItem;
}

export interface IfcState {
    models: { [modelID: number]: IfcModel };
    api: IfcAPI;
}

export interface IfcMesh extends Mesh {
    modelID: number;
}

export type GeometryByMaterial = {
    material: Material;
    geometry: BufferGeometry[];
    indices: { [keys: number]: number };
    lastIndex: number;
};

export interface GeometriesByMaterial {
    [key: string]: GeometryByMaterial;
}

export interface Node {
    expressID: number;
    hasSpatialChildren: Node[];
    hasChildren: Node[];
}
