import { BufferGeometry, Intersection } from "three";
import { DisplayManager } from "./DisplayManager";
export declare class ItemPicker {
    private display;
    constructor(displayManager: DisplayManager);
    pickItem(items: Intersection[], geometry: BufferGeometry, pickTransparent?: boolean): Intersection | null | undefined;
}
