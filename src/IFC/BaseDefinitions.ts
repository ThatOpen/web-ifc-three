import { BufferAttribute, BufferGeometry, Material, Mesh, Scene } from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import {
    IFCRELAGGREGATES,
    IFCRELCONTAINEDINSPATIALSTRUCTURE,
    IFCRELDEFINESBYPROPERTIES,
    IFCRELDEFINESBYTYPE,
} from 'web-ifc';
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

export interface TypesMap {
    [key: number]: number;
}

export interface IfcModel {
    modelID: number;
    mesh: IfcMesh;
    items: GeometriesByMaterials;
    types: TypesMap;
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
    type: string;
    children: Node[];
}

export interface pName {
    name: number;
    relating: string;
    related: string;
    key: string;
}

export const PropsNames = {
    aggregates: {
        name: IFCRELAGGREGATES,
        relating: 'RelatingObject',
        related: 'RelatedObjects',
        key: 'children'
    },
    spatial: {
        name: IFCRELCONTAINEDINSPATIALSTRUCTURE,
        relating: 'RelatingStructure',
        related: 'RelatedElements',
        key: 'children'
    },
    psets: {
        name: IFCRELDEFINESBYPROPERTIES,
        relating: 'RelatingPropertyDefinition',
        related: 'RelatedObjects',
        key: 'hasPsets'
    },
    type: {
        name: IFCRELDEFINESBYTYPE,
        relating: 'RelatingType',
        related: 'RelatedObjects',
        key: 'hasType'
    }
}
