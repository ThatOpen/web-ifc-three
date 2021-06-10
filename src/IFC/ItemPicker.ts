import { BufferGeometry, DoubleSide, Intersection, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, Scene } from 'three';
import { IfcState, IfcModel } from './BaseDefinitions';
import { DisplayAttr } from './BaseDefinitions';
import { DisplayManager } from './DisplayManager';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

export class ItemPicker {
    private display: DisplayManager;
    private state: IfcState;
    private highlightMaterial: Material;
    private previousSelection: Mesh;

    constructor(state: IfcState, displayManager: DisplayManager) {
        this.state = state;
        this.display = displayManager;
        this.previousSelection = {} as Mesh;
        this.highlightMaterial = new MeshLambertMaterial({
            color: 0xff00ff,
            depthTest: false,
            side: DoubleSide,
            transparent: true,
            opacity: 0.2
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
            const visible = geometry.getAttribute(DisplayAttr.a).array[trueIndex];
            if (pickTransparent && visible != 0) return items[i];
            else if (visible == 1) return items[i];
        }

        return null;
    }

    pickItem(modelID: number, id: number, scene: Scene) {
        if(!this.state.models[modelID].items[id]) return;

        // const geometry = this.state.models[modelID].items[id];
        // const geometries = Object.values(this.state.models[modelID].items);
        // const allGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

        const mesh = this.state.models[modelID].items[id];
        if(this.previousSelection == mesh) return;
        mesh.renderOrder = 1;

        scene.add(mesh);
        if (this.previousSelection) scene.remove(this.previousSelection);
        this.previousSelection = mesh;
        return id;
    }
}
