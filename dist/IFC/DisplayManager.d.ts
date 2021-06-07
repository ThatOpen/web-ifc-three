import { Display, MapIDFaceIndex, TransparentMesh } from './BaseDefinitions';
import { BufferGeometry, Material, Mesh, Scene } from 'three';
export declare class DisplayManager {
    private mapIDFaceindex;
    constructor(mapIDFaceindex: MapIDFaceIndex);
    setItemsDisplay(ids: number[], mesh: Mesh, state: Display, scene: Scene): void;
    setFaceDisplay(geometry: BufferGeometry, index: number, state: Display): void;
    setFaceAttribute(geometry: BufferGeometry, attr: string, state: number, index: number, geoIndex: ArrayLike<number>): void;
    setupVisibility(geometry: BufferGeometry): void;
    setupTransparency(mesh: TransparentMesh, scene: Scene): void;
    newTransparent(mat: Material): Material;
}
