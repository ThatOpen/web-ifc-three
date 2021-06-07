import { Display, MapIDFaceIndex } from './BaseDefinitions';
import { BufferGeometry, Mesh, Scene } from 'three';
export declare class DisplayManager {
    private mapIDFaceindex;
    constructor(mapIDFaceindex: MapIDFaceIndex);
    setItemsDisplay(ids: number[], mesh: Mesh, state: Display, scene: Scene): void;
    setupVisibility(geometry: BufferGeometry): void;
    private setFaceDisplay;
    private setFaceAttribute;
    private setupTransparency;
    private newTransparent;
}
