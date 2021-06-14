import { BufferAttribute, BufferGeometry, Material, Mesh, Scene } from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { IfcAPI } from 'web-ifc';

export const IdAttrName = 'expressID';

export type IdAttributeByMaterial = { [id: number]: number };
export type IdAttributesByMaterials = { [materialID: string]: IdAttributeByMaterial };

export const merge = (geoms: BufferGeometry[], createGroups = false) => {
    return BufferGeometryUtils.mergeBufferGeometries(geoms, createGroups);
};

export const newFloatAttr = (data: any[], size: number) => {
    return new BufferAttribute(new Float32Array(data), size);
};

export const newIntAttr = (data: any[], size: number) => {
    return new BufferAttribute(new Uint32Array(data), size);
};

export type HighlightConfig = {
    scene: Scene;
    modelID: number;
    ids: number[];
    removePrevious: boolean;
    material?: Material;
};

export const DEFAULT = 'default';

export type SelectedItems = {
    [matID: string]: { ids: Set<number>; mesh: Mesh };
};

export type MapFaceindexID = { [key: number]: number };

export type IdGeometries = {
    [expressID: number]: BufferGeometry;
};

export type GeometriesByMaterial = {
    material: Material;
    geometries: IdGeometries;
};

export interface GeometriesByMaterials {
    [materialID: string]: GeometriesByMaterial;
}

export interface IfcModel {
    modelID: number;
    mesh: IfcMesh;
    items: GeometriesByMaterials;
}

export interface IfcState {
    models: { [modelID: number]: IfcModel };
    api: IfcAPI;
}

export interface IfcMesh extends Mesh {
    modelID: number;
}

export interface Node {
    expressID: number;
    hasSpatialChildren: Node[];
    hasChildren: Node[];
}
