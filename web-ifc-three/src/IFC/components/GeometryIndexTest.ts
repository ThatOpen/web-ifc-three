import {BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial} from "three";
import {IfcModel} from "../BaseDefinitions";

export function generateGeometryIndexMap(geometry: BufferGeometry) {

    const map = new Map<number, any>();

    if (!geometry.index) throw new Error("BufferGeometry is not indexed.")

    for (const group of geometry.groups) {

        let prevExpressID = -1;

        const materialIndex = group.materialIndex!;
        const end = group.start + group.count;

        for (let i = group.start; i < end; i++) {
            const index = geometry.index.array[i];
            const expressID = geometry.attributes.expressID.array[index];
            const endOfArr = (i + 1) === end;

            if (endOfArr) {

                // Reset expressID since we're at the end for this group.
                // The next group might start with the same expressID;
                // prevExpressID = -1;

                // Finalise entry for this group
                const entry = map.get(expressID);
                if (entry && entry[materialIndex]) {
                    map.set(expressID, {
                        ...entry,
                        [materialIndex]: [...entry[materialIndex], i]
                    });
                }
                break;
            }

            // The expressID has changed
            if (prevExpressID !== expressID) {

                // Finalise previous entry
                const prevEntry = map.get(prevExpressID);
                if (prevEntry && prevEntry[materialIndex]) {
                    map.set(prevExpressID, {
                        ...prevEntry,
                        [materialIndex]: [...prevEntry[materialIndex], i - 1]
                    });
                }

                // Create new
                const existingEntry = map.get(expressID);
                map.set(expressID, {
                    ...existingEntry,
                    [materialIndex]: [i]
                });

                // Update prev change
                prevExpressID = expressID;
            }
        }
    }
    return map;
}

export function createGeomByExpressID(model: IfcModel, expressID: number) {

    const t0 = window.performance.now();

    const map = model.map;
    const geometry = model.mesh.geometry;
    const entry = map.get(expressID);
    console.log(entry);

    if (!geometry.index) throw new Error(`BufferGeometry is not indexed.`)
    if (!entry) throw new Error(`Entry for expressID: ${expressID} not found.`)

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

    console.log("Original Index Slice")
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

    const cube = new Mesh(newGeom, new MeshBasicMaterial({ color: "red", depthTest: false, side: 2 }));
    model.mesh.add(cube);
    cube.position.x += 4;
}