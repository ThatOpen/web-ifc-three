import { VertexProps } from "./BaseDefinitions";

export class ItemPicker {
    constructor(displayManager){
        this.display = displayManager;
    }

    pickItem(items, geometry, pickTransparent = true) {
        this.display.setupVisibility(geometry);

        for (let i = 0; i < items.length; i++) {
            const index = items[i].faceIndex;
            const trueIndex = geometry.index.array[index * 3];
            const visible = geometry.getAttribute(VertexProps.a).array[trueIndex];
            if (pickTransparent && visible != 0) return items[i];
            else if (visible == 1) return items[i];
        }

        return null;
    }
}