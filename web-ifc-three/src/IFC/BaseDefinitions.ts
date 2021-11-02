import { BufferAttribute, BufferGeometry, Material, Matrix4, Mesh, Object3D } from 'three';
// TODO: Remove ts ignore comments when @types/three gets updated
// @ts-ignore
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import {
    FlatMesh,
    IfcGeometry,
    IFCRELAGGREGATES, IFCRELASSOCIATESMATERIAL,
    IFCRELCONTAINEDINSPATIALSTRUCTURE,
    IFCRELDEFINESBYPROPERTIES,
    IFCRELDEFINESBYTYPE, LoaderError, LoaderSettings, RawLineData, Vector
} from 'web-ifc';
import {ParserProgress} from "./components/IFCParser";

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
    customId?: string;
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

export interface Worker {
    active: boolean;
    path: string;
}

export interface IfcState {
    models: { [modelID: number]: IfcModel };
    api: WebIfcAPI;
    useJSON: boolean;
    worker: Worker;
    webIfcSettings?: LoaderSettings;
    onProgress?: (event: ParserProgress) => void;
    coordinationMatrix?: Matrix4
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

export interface WebIfcAPI {

    wasmModule: any;

    Init(): void | Promise<void>;

    // To close the web worker
    Close?: () => void;

    /**
     * Opens a model and returns a modelID number
     * @data Buffer containing IFC data (bytes)
     * @data Settings settings for loading the model
     */
    OpenModel(data: string | Uint8Array, settings?: LoaderSettings): number | Promise<number>;

    /**
     * Creates a new model and returns a modelID number
     * @data Settings settings for generating data the model
     */
    CreateModel(settings?: LoaderSettings): number | Promise<number>;

    ExportFileAsIFC(modelID: number): Uint8Array | Promise<Uint8Array>;

    /**
     * Opens a model and returns a modelID number
     * @modelID Model handle retrieved by OpenModel, model must not be closed
     * @data Buffer containing IFC data (bytes)
     */
    GetGeometry(modelID: number, geometryExpressID: number): IfcGeometry | Promise<IfcGeometry>;

    GetLine(modelID: number, expressID: number, flatten?: boolean):  any | Promise<any>;

    GetAndClearErrors(modelID: number): Vector<LoaderError> | Promise<Vector<LoaderError>>;

    WriteLine(modelID: number, lineObject: any): void | Promise<void>;

    FlattenLine(modelID: number, line: any): void | Promise<void>;

    GetRawLineData(modelID: number, expressID: number): RawLineData | Promise<RawLineData>;

    WriteRawLineData(modelID: number, data: RawLineData):  any | Promise<any>;

    GetLineIDsWithType(modelID: number, type: number): Vector<number> | Promise<Vector<number>>;

    GetAllLines(modelID: Number): Vector<number> | Promise<Vector<number>>;

    SetGeometryTransformation(modelID: number, transformationMatrix: Array<number>): void | Promise<void>;

    GetCoordinationMatrix(modelID: number): Array<number> | Promise<Array<number>>;

    GetVertexArray(ptr: number, size: number): Float32Array | Promise<Float32Array>;

    GetIndexArray(ptr: number, size: number): Uint32Array | Promise<Uint32Array>;

    getSubArray(heap: any, startPtr: any, sizeBytes: any): any | Promise<any>;

    /**
     * Closes a model and frees all related memory
     * @modelID Model handle retrieved by OpenModel, model must not be closed
     */
    CloseModel(modelID: number): void | Promise<void>;

    StreamAllMeshes(modelID: number, meshCallback: (mesh: FlatMesh) => void): void | Promise<void>;

    StreamAllMeshesWithTypes(modelID: number, types: Array<number>, meshCallback: (mesh: FlatMesh) => void): void | Promise<void>;

    /**
     * Checks if a specific model ID is open or closed
     * @modelID Model handle retrieved by OpenModel
     */
    IsModelOpen(modelID: number): boolean | Promise<boolean>;

    /**
     * Load all geometry in a model
     * @modelID Model handle retrieved by OpenModel
     */
    LoadAllGeometry(modelID: number): Vector<FlatMesh> | Promise<Vector<FlatMesh>>;

    /**
     * Load geometry for a single element
     * @modelID Model handle retrieved by OpenModel
     */
    GetFlatMesh(modelID: number, expressID: number): FlatMesh | Promise<FlatMesh>;

    SetWasmPath(path: string): void | Promise<void>;
}
