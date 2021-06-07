import { VertexProps } from './BaseDefinitions';
import { BufferAttribute } from 'three/build/three.module';
import { TransparentShader } from './Shaders';

export class DisplayManager {
    constructor(mapFaceindexID, mapIDFaceindex) {
        this.mapFaceindexID = mapFaceindexID;
        this.mapIDFaceindex = mapIDFaceindex;
    }

    setItemsDisplay(expressIds, mesh, state, scene) {
        const geometry = mesh.geometry;
        this.setupVisibility(geometry);

        const faceIndicesArray = expressIds.map((id) => this.mapIDFaceindex[id]);
        var faceIndices = [].concat.apply([], faceIndicesArray);
        faceIndices.forEach((faceIndex) => this.setFaceDisplay(geometry, faceIndex, state));

        geometry.attributes[VertexProps.r].needsUpdate = true;
        geometry.attributes[VertexProps.g].needsUpdate = true;
        geometry.attributes[VertexProps.b].needsUpdate = true;
        geometry.attributes[VertexProps.a].needsUpdate = true;
        geometry.attributes[VertexProps.h].needsUpdate = true;

        if (state.a != 1) this.updateTransparency(mesh, scene, state);
    }

    setFaceDisplay(geometry, index, state) {
        const geoIndex = geometry.index.array;
        this.setFaceAttribute(geometry, VertexProps.r, state.r, index, geoIndex);
        this.setFaceAttribute(geometry, VertexProps.g, state.g, index, geoIndex);
        this.setFaceAttribute(geometry, VertexProps.b, state.b, index, geoIndex);
        this.setFaceAttribute(geometry, VertexProps.a, state.a, index, geoIndex);
        this.setFaceAttribute(geometry, VertexProps.h, state.h, index, geoIndex);
    }

    setFaceAttribute(geometry, attribute, state, index, geoIndex) {
        geometry.attributes[attribute].setX(geoIndex[3 * index], state);
        geometry.attributes[attribute].setX(geoIndex[3 * index + 1], state);
        geometry.attributes[attribute].setX(geoIndex[3 * index + 2], state);
    }

    setupVisibility(geometry) {
        if (!geometry.attributes[VertexProps.r]) {
            const zeros = new Float32Array(geometry.getAttribute('position').count);
            geometry.setAttribute(VertexProps.r, new BufferAttribute(zeros.slice(), 1));
            geometry.setAttribute(VertexProps.g, new BufferAttribute(zeros.slice(), 1));
            geometry.setAttribute(VertexProps.b, new BufferAttribute(zeros.slice(), 1));
            geometry.setAttribute(VertexProps.a, new BufferAttribute(zeros.slice().fill(1), 1));
            geometry.setAttribute(VertexProps.h, new BufferAttribute(zeros, 1));
        }
    }

    updateTransparency(mesh, scene, state) {
        if (!mesh.geometry._transparentMesh) this.setupTransparency(mesh, scene);
    }

    setupTransparency(mesh, scene) {
        const transparentMesh = mesh.clone();

        const transparentMaterials = [];
        transparentMesh.material.forEach((mat) => {
            const newMat = mat.clone();
            newMat.transparent = true;
            // newMat.depthTest = false;
            newMat.onBeforeCompile = TransparentShader;
            transparentMaterials.push(newMat);
        });
        transparentMesh.material = transparentMaterials;

        scene.add(transparentMesh);
        mesh.geometry._transparentMesh = transparentMesh;
    }
}
