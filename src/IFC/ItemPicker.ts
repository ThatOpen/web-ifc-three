import { BufferGeometry, Intersection, Mesh } from "three";
import { VertexProps } from "./BaseDefinitions";
import { DisplayManager } from "./DisplayManager";

export class ItemPicker {

    private display: DisplayManager;

    constructor(displayManager: DisplayManager){
        this.display = displayManager;
    }

    pickItem(items: Intersection[], pickTransparent = true) {

        for (let i = 0; i < items.length; i++) {
            const mesh = items[i].object as Mesh;
            const geometry = mesh.geometry;
            this.display.setupVisibility(geometry);
            const index = items[i].faceIndex;
            if(!index || !geometry.index) continue;
            const trueIndex = geometry.index.array[index * 3];
            const visible = geometry.getAttribute(VertexProps.a).array[trueIndex];
            if (pickTransparent && visible != 0) return items[i];
            else if (visible == 1) return items[i];
        }

        return null;
    }
}