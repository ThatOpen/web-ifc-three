import { BufferAttribute, BufferGeometry, Material, Mesh, Object3D } from 'three';
// TODO: Remove ts ignore comments when @types/three gets updated
// @ts-ignore
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import {
    IFCRELAGGREGATES, IFCRELASSOCIATESMATERIAL,
    IFCRELCONTAINEDINSPATIALSTRUCTURE,
    IFCRELDEFINESBYPROPERTIES,
    IFCRELDEFINESBYTYPE, LoaderSettings
} from 'web-ifc';
import { IfcAPI } from 'web-ifc';

export const IdAttrName = 'expressID';

export type IdAttributeByMaterial = { [id: number]: number };
export type IdAttributesByMaterials = { [materialID: string]: IdAttributeByMaterial };

export const merge = (geoms: BufferGeometry[], createGroups = false) => {
    // @ts-ignore
    return mergeBufferGeometries(geoms, createGroups);
};

export const newFloatAttr = (data: any[], size: number) => {
    return new BufferAttribute(new Float32Array(data), size);
};

export const newIntAttr = (data: any[], size: number) => {
    return new BufferAttribute(new Uint32Array(data), size);
};

//TODO: Rename "scene" to "parent" in the next major release
export interface HighlightConfig {
    scene: Object3D;
    ids: number[];
    removePrevious: boolean;
    material?: Material;
}

export interface HighlightConfigOfModel extends HighlightConfig {
    modelID: number;
}

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
    jsonData: { [id: number]: JSONObject };
}

export interface JSONObject {
    expressID: number;
    type: string;

    [key: string]: any;
}

export interface IfcState {
    models: { [modelID: number]: IfcModel };
    api: IfcAPI;
    useJSON: boolean;
    webIfcSettings?: LoaderSettings;
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
    materials: {
        name: IFCRELASSOCIATESMATERIAL,
        relating: 'RelatingMaterial',
        related: 'RelatedObjects',
        key: 'hasMaterial'
    },
    type: {
        name: IFCRELDEFINESBYTYPE,
        relating: 'RelatingType',
        related: 'RelatedObjects',
        key: 'hasType'
    }
};
