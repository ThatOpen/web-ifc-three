import { BufferGeometry, Material, Mesh, MeshLambertMaterial, Scene } from 'three';
import {
    IfcState,
    HighlightConfig,
    GeometriesByMaterial,
    GeometriesByMaterials,
    IdGeometries,
    merge
} from './BaseDefinitions';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

export class DisplayManager {
    private state: IfcState;
    private previousSelection: { ids: number[]; mesh: Mesh };

    constructor(state: IfcState) {
        this.state = state;
        this.previousSelection = { mesh: {} as Mesh, ids: [] };
    }

    highlight(modelID: number, ids: number[], scene: Scene, config: HighlightConfig) {
        if (this.isPreviousSelection(ids)) return;

        const selected = this.filter(modelID, ids);
       
        const geomsByMaterial: BufferGeometry[] = [];
        const mats: Material[] = [];
        for(let materialID in selected){
            const geoms = Object.values(selected[materialID].geometries);
            if(!geoms.length) continue;
            mats.push(selected[materialID].material)
            if(geoms.length > 1) geomsByMaterial.push(merge(geoms));
            else geomsByMaterial.push(...geoms);
        }
        const allGeometry = merge(geomsByMaterial, true);
        const mesh = new Mesh(allGeometry, mats);
        scene.add(mesh);

        // if (config?.material) {
        //     mesh.material = [config.material];
        //     const groups = mesh.geometry.groups;
        //     mesh.geometry.groups = [
        //         {
        //             start: groups[0].start,
        //             count: groups.map((g) => g.count).reduce((a, b) => a + b, 0),
        //             materialIndex: 0
        //         }
        //     ];
        // }

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
        const filtered: GeometriesByMaterials = {};
        for (let materialID in items) {
            filtered[materialID] = {
                material: items[materialID].material,
                geometries: this.filterGeometries(ids, items[materialID].geometries)
            };
        }
        return filtered;
    }

    private filterGeometries(ids: number[], geometries: IdGeometries) {
        return Object.keys(geometries)
            .filter((key) => ids.includes(parseInt(key, 10)))
            //@ts-ignore
            .reduce((obj, key) => { return { ...obj, [key]: geometries[key] };}, {});
    }
}
