import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial } from 'three';
import { IfcModel } from '../BaseDefinitions';

export type GeometryIndicesMap = Map<number, { [materialIndex: number]: number[] }>;

export function generateGeometryIndexMap(geometry: BufferGeometry) {

    const map = new Map<number, { [materialIndex: number]: number[] }>();

    if (!geometry.index) throw new Error('BufferGeometry is not indexed.');

    for (const group of geometry.groups) {

        let prevExpressID = -1;

        const materialIndex = group.materialIndex!;
        const materialStart = group.start;
        const materialEnd = materialStart + group.count - 1;

        let objectStart = -1;
        let objectEnd = -1;

        for (let i = materialStart; i <= materialEnd; i++) {
            const index = geometry.index.array[i];
            const expressID = geometry.attributes.expressID.array[index];

            // First iteration
            if (prevExpressID === -1) {
                prevExpressID = expressID;
                objectStart = i;
            }

            // It's the end of the material, which also means end of the object
            const isEndOfMaterial = i === materialEnd;
            if (isEndOfMaterial) {
                const store = getMaterialStore(map, expressID, materialIndex);
                store.push(objectStart, materialEnd);
                break;
            }

            // Still going through the same object
            if (prevExpressID === expressID) continue;

            // New object starts; save previous object

            // Store previous object
            const store = getMaterialStore(map, prevExpressID, materialIndex);
            objectEnd = i - 1;
            store.push(objectStart, objectEnd);

            // Get ready to process next object
            prevExpressID = expressID;
            objectStart = i;
        }
    }
    return map;
}

function getMaterialStore(map: GeometryIndicesMap, id: number, matIndex: number) {
    // If this object wasn't store before, add it to the map
    if (map.get(id) === undefined) {
        map.set(id, {});
    }
    const storedIfcItem = map.get(id);
    if (storedIfcItem === undefined) throw new Error('Geometry map generation error');

    // If this material wasn't stored for this object before, add it to the object
    if (storedIfcItem[matIndex] === undefined) {
        storedIfcItem[matIndex] = [];
    }
    return storedIfcItem[matIndex];
}

export function createGeomByExpressID(model: IfcModel, expressID: number) {

    const t0 = window.performance.now();

    const map = model.map;
    const geometry = model.mesh.geometry;
    const entry = map.get(expressID);
    console.log(entry);

    if (!geometry.index) throw new Error(`BufferGeometry is not indexed.`);
    if (!entry) throw new Error(`Entry for expressID: ${expressID} not found.`);

    const positions = [];
    const normals = [];
    const originalIndexSlice = [];
    const indexes = [];

    let smallestIndex = -1;

    for (const materialIndex in entry) {

        const index = Number.parseInt(materialIndex);
        const value = entry[index];
        const start = value[0];
        const end = value[1];

        for (let i = start; i < end; i++) {
            const index = geometry.index.array[i];
            if (smallestIndex === -1 || smallestIndex > index) smallestIndex = index;
        }
    }

    console.log(`Smallest: ${smallestIndex}`);

    for (const materialIndex in entry) {

        const index = Number.parseInt(materialIndex);
        const value = entry[index];
        const start = value[0];
        const end = value[1];

        for (let i = start; i < end; i++) {

            const index = geometry.index.array[i];
            const positionIndex = index * 3;

            originalIndexSlice.push(index);
            indexes.push(index - smallestIndex);

            const v1 = geometry.attributes.position.array[positionIndex];
            const v2 = geometry.attributes.position.array[positionIndex + 1];
            const v3 = geometry.attributes.position.array[positionIndex + 2];

            const n1 = geometry.attributes.normal.array[positionIndex];
            const n2 = geometry.attributes.normal.array[positionIndex + 1];
            const n3 = geometry.attributes.normal.array[positionIndex + 2];

            const newIndex = (index - smallestIndex) * 3;

            positions[newIndex] = v1;
            positions[newIndex + 1] = v2;
            positions[newIndex + 2] = v3;

            normals[newIndex] = n1;
            normals[newIndex + 1] = n2;
            normals[newIndex + 2] = n3;
        }
    }

    console.log(positions);
    console.log(normals);
    console.log(indexes);

    console.log('Original Index Slice');
    console.log(originalIndexSlice);

    const newGeom = new BufferGeometry();
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    newGeom.setAttribute(
        'position',
        new BufferAttribute(new Float32Array(positions), positionNumComponents));
    newGeom.setAttribute(
        'normal',
        new BufferAttribute(new Float32Array(normals), normalNumComponents));

    newGeom.setIndex(indexes);

    const cube = new Mesh(newGeom, new MeshBasicMaterial({ color: 'red', depthTest: false, side: 2 }));
    model.mesh.add(cube);
    cube.position.x += 4;
}