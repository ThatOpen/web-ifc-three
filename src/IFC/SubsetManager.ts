import { BufferGeometry, Material, Mesh, MeshLambertMaterial, Scene } from 'three';
import {
    IfcState,
    HighlightConfig,
    GeometriesByMaterials,
    IdGeometries,
    merge,
    SelectedItems,
    DEFAULT
} from './BaseDefinitions';

export class SubsetManager {
    private state: IfcState;
    private selected: SelectedItems;

    constructor(state: IfcState) {
        this.state = state;
        this.selected = {};
    }

    getSubset(modelID: number, material?: Material) {
        const currentMat = this.matIDNoConfig(modelID, material);
        if (!this.selected[currentMat]) return null;
        return this.selected[currentMat].mesh;
    }

    removeSubset(modelID: number, scene?: Scene, material?: Material) {
        const currentMat = this.matIDNoConfig(modelID, material);
        if (!this.selected[currentMat]) return;
        if(scene) scene.remove(this.selected[currentMat].mesh);
        delete this.selected[currentMat];
    }

    createSubset(config: HighlightConfig) {
        if (!this.isConfigValid(config)) return;
        if (this.isPreviousSelection(config)) return;
        if (this.isEasySelection(config)) return this.addToPreviousSelection(config);
        this.updatePreviousSelection(config.scene, config);
        return this.createSelectionInScene(config);
    }

    private createSelectionInScene(config: HighlightConfig) {
        const filtered = this.filter(config);
        const { geomsByMaterial, materials } = this.getGeomAndMat(filtered);
        const hasDefaultMaterial = this.matID(config) == DEFAULT;
        const geometry = merge(geomsByMaterial, hasDefaultMaterial);
        const mats = hasDefaultMaterial ? materials : config.material;
        //@ts-ignore
        const mesh = new Mesh(geometry, mats);
        this.selected[this.matID(config)].mesh = mesh;
        //@ts-ignore
        mesh.modelID = config.modelID;
        config.scene.add(mesh);
        return mesh;
    }

    private isConfigValid(config: HighlightConfig) {
        return (
            this.isValid(config.scene) &&
            this.isValid(config.modelID) &&
            this.isValid(config.ids) &&
            this.isValid(config.removePrevious)
        );
    }

    private isValid(item: any) {
        return item != undefined && item != null;
    }

    private getGeomAndMat(filtered: GeometriesByMaterials) {
        const geomsByMaterial: BufferGeometry[] = [];
        const materials: Material[] = [];
        for (let matID in filtered) {
            const geoms = Object.values(filtered[matID].geometries);
            if (!geoms.length) continue;
            materials.push(filtered[matID].material);
            if (geoms.length > 1) geomsByMaterial.push(merge(geoms));
            else geomsByMaterial.push(...geoms);
        }
        return { geomsByMaterial, materials };
    }

    private updatePreviousSelection(scene: Scene, config: HighlightConfig) {
        const previous = this.selected[this.matID(config)];
        if (!previous) return this.newSelectionGroup(config);
        scene.remove(previous.mesh);
        config.removePrevious
            ? (previous.ids = new Set(config.ids))
            : config.ids.forEach((id) => previous.ids.add(id));
    }

    private newSelectionGroup(config: HighlightConfig) {
        this.selected[this.matID(config)] = {
            ids: new Set(config.ids),
            mesh: {} as Mesh
        };
    }

    private isPreviousSelection(config: HighlightConfig) {
        if (!this.selected[this.matID(config)]) return false;
        if (this.containsIds(config)) return true;
        const previousIds = this.selected[this.matID(config)].ids;
        return JSON.stringify(config.ids) === JSON.stringify(previousIds);
    }

    private containsIds(config: HighlightConfig) {
        const newIds = config.ids;
        const previous = Array.from(this.selected[this.matID(config)].ids);
        // prettier-ignore
        //@ts-ignore
        return newIds.every((i => v => (i = previous.indexOf(v, i) + 1))(0));
    }

    private addToPreviousSelection(config: HighlightConfig) {
        const previous = this.selected[this.matID(config)];
        const filtered = this.filter(config);
        // prettier-ignore
        const geometries = Object.values(filtered).map((i) => Object.values(i.geometries)).flat();
        const previousGeom = previous.mesh.geometry;
        previous.mesh.geometry = merge([previousGeom, ...geometries]);
        config.ids.forEach((id) => previous.ids.add(id));
    }

    private filter(config: HighlightConfig) {
        const items = this.state.models[config.modelID].items;
        const filtered: GeometriesByMaterials = {};
        for (let matID in items) {
            filtered[matID] = {
                material: items[matID].material,
                geometries: this.filterGeometries(new Set(config.ids), items[matID].geometries)
            };
        }
        return filtered;
    }

    private filterGeometries(selectedIDs: Set<number>, geometries: IdGeometries) {
        const ids = Array.from(selectedIDs);
        return Object.keys(geometries)
            .filter((key) => ids.includes(parseInt(key, 10)))
            .reduce((obj, key) => {
                //@ts-ignore
                return { ...obj, [key]: geometries[key] };
            }, {});
    }

    private isEasySelection(config: HighlightConfig) {
        const matID = this.matID(config);
        const def = this.matIDNoConfig(config.modelID);
        if (!config.removePrevious && matID != def && this.selected[matID]) return true;
    }

    private matID(config: HighlightConfig) {
        if (!config.material) return DEFAULT;
        const name = config.material.uuid || DEFAULT;
        return name.concat(" - ").concat(config.modelID.toString())
    }

    private matIDNoConfig(modelID: number, material?: Material) {
        let name = DEFAULT;
        if(material) name = material.uuid;
        return name.concat(" - ").concat(modelID.toString())
    }
}
