import { GeometriesByMaterials } from '../../BaseDefinitions';
import { MaterialReconstructor, SerializedMaterial } from './Material';
import { GeometryReconstructor, SerializedGeometry } from './Geometry';
import { MeshLambertMaterial } from 'three';

export interface SerializedGeomsByMat {
    [materialID: string]: {
        material: SerializedMaterial,
        geometries: {[expressID: number]: SerializedGeometry}
    }
}

export class SerializedGeomsByMaterials implements SerializedGeomsByMat {

    constructor(geoms: GeometriesByMaterials) {
        const matIDs = Object.keys(geoms);
        matIDs.forEach(id => {
            this[id] = {} as any;
            this[id].material = new SerializedMaterial(geoms[id].material as MeshLambertMaterial);
            this[id].geometries = {};
            const expressIDs = Object.keys(geoms[id].geometries).map(key => parseInt(key));
            expressIDs.forEach(expressID => {
                this[id].geometries[expressID] = new SerializedGeometry(geoms[id].geometries[expressID]);
            })
        })
    }

    [materialID: string]: { material: SerializedMaterial; geometries: { [expressID: number]: SerializedGeometry; }; };
}

export class GeomsByMaterialsReconstructor {
    static new(serialized: SerializedGeomsByMaterials) {
        const geomsByMat: GeometriesByMaterials = {}
        const matIDs = Object.keys(serialized);
        matIDs.forEach(id => {
            geomsByMat[id] = {} as any;
            geomsByMat[id].material = MaterialReconstructor.new(serialized[id].material);
            geomsByMat[id].geometries = {};
            const expressIDs = Object.keys(serialized[id].geometries).map(id => parseInt(id));
            expressIDs.forEach(expressID => {
                geomsByMat[id].geometries[expressID] = GeometryReconstructor.new(serialized[id].geometries[expressID]);
            })
        })
        return geomsByMat;
    }
}