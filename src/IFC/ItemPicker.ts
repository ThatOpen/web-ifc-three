import {
    BufferGeometry,
    DoubleSide,
    Intersection,
    Material,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    Scene
} from 'three';
import { IfcState, IfcModel, HighlightConfig, MaterialItem } from './BaseDefinitions';
import { DisplayAttr } from './BaseDefinitions';
import { DisplayManager } from './DisplayManager';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

type PreviousSelection = {
    ids: number[];
    mesh: Mesh;
};

export class ItemPicker {
    private state: IfcState;
    private previousSelection: PreviousSelection;

    constructor(state: IfcState) {
        this.state = state;
        this.previousSelection = {
            mesh: {} as Mesh,
            ids: []
        };
    }

    highlight(modelID: number, ids: number[], scene: Scene, config: HighlightConfig) {
        if (this.isPreviousSelection(ids)) return;

        const selected = this.filter(modelID, ids);
        const grouped: MaterialItem = {};
        for (let matItem of selected) {
            for (let matID in matItem) {
                if (!grouped[matID]) grouped[matID] = matItem[matID];
                else
                    grouped[matID].geom = BufferGeometryUtils.mergeBufferGeometries([
                        grouped[matID].geom,
                        matItem[matID].geom
                    ]);
            }
        }

        const all = Object.values(grouped);
        const geoms = all.map(i => i.geom);
        const mats = all.map(i => i.mat);
        
        const allGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms, true);
        const mesh = new Mesh(allGeometry, mats);
        scene.add(mesh);

        if (config?.material) mesh.material = [config.material];

        if (config?.removePrevious) scene.remove(this.previousSelection.mesh);
        this.previousSelection.mesh = mesh;

        this.previousSelection.mesh = mesh;
        this.previousSelection.ids = ids;
    }

    private isPreviousSelection(ids: number[]) {
        return JSON.stringify(ids) === JSON.stringify(this.previousSelection.ids);
    }

    private filter(modelID: number, ids: number[]) {
        const items = this.state.models[modelID].items;
        const filtered: MaterialItem[] = [];
        ids.forEach((id) => filtered.push(items[id]));
        return filtered;
    }
}
