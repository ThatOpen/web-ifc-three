import {Color, DoubleSide, MeshLambertMaterial} from 'three';

export class SerializedMaterial {
    color: number[];
    opacity: number;
    transparent: boolean;

    constructor(material: MeshLambertMaterial) {
        this.color = [material.color.r, material.color.g, material.color.b];
        this.opacity = material.opacity;
        this.transparent = material.transparent;
    }
}

export class MaterialReconstructor {
    static new(material: SerializedMaterial) {
        return new MeshLambertMaterial({
            color: new Color(material.color[0], material.color[1], material.color[2]),
            opacity: material.opacity,
            transparent: material.transparent,
            side: DoubleSide
        })
    }
}