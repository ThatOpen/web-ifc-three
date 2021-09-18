import { IfcModel, IfcState } from '../BaseDefinitions';
import { Mesh } from 'three';

export class MemoryCleaner {
    constructor(private state: IfcState) {};

    releaseAllModels() {
        const models = Object.values(this.state.models);
        models.forEach(model => {
            this.releaseMeshModelMemory(model);
            this.releaseJSONMemory(model);
            this.releaseGeometryByMaterials(model);
            // @ts-ignore
            model.types = null;
        });
    }

    private releaseGeometryByMaterials(model: IfcModel) {
        const keys = Object.keys(model.items);
        keys.forEach(key => {
            const geomsByMat = model.items[key];
            geomsByMat.material.dispose();
            // @ts-ignore
            geomsByMat.material = null;

            Object.values(geomsByMat.geometries).forEach(geom => geom.dispose());
            // @ts-ignore
            geomsByMat.geometries = null;
        });
        // @ts-ignore
        model.items = null;
    }

    private releaseJSONMemory(model: IfcModel) {
        const keys = Object.keys(model.jsonData);
        keys.forEach((key) => delete model.jsonData[parseInt(key)]);
        // @ts-ignore
        model.jsonData = null;
    }

    private releaseMeshModelMemory(model: IfcModel) {
        this.releaseMeshMemory(model.mesh);
        // @ts-ignore
        model.mesh = null;
    }

    private releaseMeshMemory(mesh: Mesh) {
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
        if (mesh.parent) {
            mesh.parent.remove(mesh);
        }
        if (mesh.material) {
            Array.isArray(mesh.material) ?
                mesh.material.forEach(mat => mat.dispose()) :
                mesh.material.dispose();
        }
        if(mesh.children.length > 0) {
            mesh.children.forEach(child => {
                if(child.type === "Mesh") this.releaseMeshMemory(child as Mesh);
                mesh.remove(child);
            })
        }
    }
}