import { BufferGeometry, Loader, LoadingManager, Scene, Material, Intersection } from 'three';

interface SpatialStructureElement {
  hasChildren: number[];
  hasSpatialChildren: SpatialStructureElement[];
}

interface DisplayState {
  r: number;
  g: number;
  b: number;
  a: number;
}

export class IFCLoader extends Loader {
  constructor(manager?: LoadingManager);
  setWasmPath(path: string): void;

  getExpressId(faceIndex: number): number;
  getItemProperties(expressId: number, all: boolean, recursive: boolean): any;
  setItemsVisibility(
    expressIds: number[],
    geometry: BufferGeometry,
    state: DisplayState,
    scene: Scene
  ): void;
  getSpatialStructure(): SpatialStructureElement;
  pickItem(items: Intersection[], geometry: BufferGeometry): Intersection;

  load(
    url: string,
    onLoad: (geometry: BufferGeometry) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void;
  parse(data: ArrayBuffer): BufferGeometry;
  getIfcItemInformation(expressID: number): object;
}
