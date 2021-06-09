import { BufferGeometry, DoubleSide, Intersection, Material, Mesh, MeshBasicMaterial, Scene } from 'three';
import { IfcState, IfcModel } from './BaseDefinitions';
import { VertexProps } from './BaseDefinitions';
import { DisplayManager } from './DisplayManager';

export class ItemPicker {
    private display: DisplayManager;
    private state: IfcState;
    private highlightMaterial: Material;
    private previousSelection: Mesh;

    constructor(state: IfcState, displayManager: DisplayManager) {
        this.state = state;
        this.display = displayManager;
        this.previousSelection = {} as Mesh;
        this.highlightMaterial = new MeshBasicMaterial({
            color: 0xff0000,
            depthTest: false,
            side: DoubleSide
        });
    }

    pickItems(items: Intersection[], pickTransparent = true) {
        for (let i = 0; i < items.length; i++) {
            const mesh = items[i].object as Mesh;
            const geometry = mesh.geometry;
            this.display.setupVisibility(geometry);
            const index = items[i].faceIndex;
            if (!index || !geometry.index) continue;
            const trueIndex = geometry.index.array[index * 3];
            const visible = geometry.getAttribute(VertexProps.a).array[trueIndex];
            if (pickTransparent && visible != 0) return items[i];
            else if (visible == 1) return items[i];
        }

        return null;
    }

    pickItem(modelID: number, id: number, scene: Scene) {
        if(!this.state.models[modelID].items[id]) return;
        const geometry = this.state.models[modelID].items[id];
        const mesh = new Mesh(geometry, this.highlightMaterial);
        mesh.renderOrder = 1;

        scene.add(mesh);
        if (this.previousSelection) scene.remove(this.previousSelection);
        this.previousSelection = mesh;
        return id;
    }
}
