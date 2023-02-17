import { BufferAttribute, BufferGeometry } from 'three';

export class SerializedGeometry {
    position: ArrayLike<number>;
    normal: ArrayLike<number>;
    expressID: ArrayLike<number>;
    index: ArrayLike<number>;
    groups: { start: number, count: number, materialIndex?: number }[];

    constructor(geometry: BufferGeometry) {
        this.position = (geometry.attributes.position as BufferAttribute)?.array || [];
        this.normal = (geometry.attributes.normal as BufferAttribute)?.array || [];
        this.expressID = (geometry.attributes.expressID as BufferAttribute)?.array || [];
        this.index = geometry.index?.array || [];
        this.groups = geometry.groups;
    }
}

export class GeometryReconstructor {
    static new(serialized: SerializedGeometry) {
        const geom = new BufferGeometry();
        GeometryReconstructor.set(geom, 'expressID', new Uint32Array(serialized.expressID), 1);
        GeometryReconstructor.set(geom, 'position', new Float32Array(serialized.position), 3);
        GeometryReconstructor.set(geom, 'normal', new Float32Array(serialized.normal), 3);
        geom.setIndex(Array.from(serialized.index));
        geom.groups = serialized.groups;
        return geom;
    }

    private static set(geom: BufferGeometry, name: string, data: ArrayLike<number>, size: number) {
        if(data.length > 0) {
            geom.setAttribute(name, new BufferAttribute(data, size));
        }
    }
}