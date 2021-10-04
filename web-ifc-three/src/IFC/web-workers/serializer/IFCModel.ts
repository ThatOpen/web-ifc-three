import { IFCModel } from '../../components/IFCModel';
import { BufferAttribute, BufferGeometry, Color, Material, MeshLambertMaterial } from 'three';

export class SerializedIfcModel {

    modelID: number;
    expressID: ArrayLike<number>;
    position: ArrayLike<number>;
    normal: ArrayLike<number>;
    index: ArrayLike<number>;
    groups: { start: number, count: number, materialIndex?: number }[];
    materials: { color: number[], transparent: boolean, opacity: number }[] = [];

    constructor(model: IFCModel) {
        this.modelID = model.modelID;

        const attributes = model.geometry.attributes;
        this.expressID = attributes.expressID?.array || [];
        this.position = attributes.position?.array || [];
        this.normal = attributes.normal?.array || [];
        this.index = model.geometry.index?.array || [];
        this.groups = model.geometry.groups;

        if (Array.isArray(model.material)) {
            model.material.forEach(mat => this.storeMaterial(mat));
        } else {
            this.storeMaterial(model.material);
        }
    }

    private storeMaterial(material: Material) {
        const mat = material as MeshLambertMaterial;
        this.materials.push({
            color: [mat.color.r, mat.color.g, mat.color.b],
            transparent: mat.transparent,
            opacity: mat.opacity
        });
    }
}

export class IfcModelReconstructor {

    reconstructModel(serialized: SerializedIfcModel) {
        const model = new IFCModel();
        model.modelID = serialized.modelID;
        this.reconstructGeometry(serialized, model);
        this.getMaterials(serialized, model);
        return model;
    }

    private reconstructGeometry(serialized: SerializedIfcModel, model: IFCModel) {
        model.geometry = new BufferGeometry();
        this.setAttribute(model, 'expressID', new Uint32Array(serialized.expressID), 1);
        this.setAttribute(model, 'position', new Float32Array(serialized.position), 3);
        this.setAttribute(model, 'normal', new Float32Array(serialized.normal), 3);
        model.geometry.setIndex(Array.from(serialized.index));
        model.geometry.groups = serialized.groups;
    }

    private setAttribute(model: IFCModel, name: string, data: ArrayLike<number>, size: number) {
        if(data.length > 0) {
            model.geometry.setAttribute(name, new BufferAttribute(data, size));
        }
    }

    private getMaterials(serialized: SerializedIfcModel, model: IFCModel) {
        model.material = [];
        const mats = model.material as Material[];
        serialized.materials.forEach(mat => {
            mats.push(new MeshLambertMaterial({
                color: new Color(...mat.color),
                opacity: mat.opacity,
                transparent: mat.transparent
            }));
        });
    }
}