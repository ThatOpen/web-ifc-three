import {
    Display,
    IfcState,
    MapIDFaceIndex,
    TransparentMesh,
    VertexProps,
    IfcMesh
} from './BaseDefinitions';
import { BufferAttribute, BufferGeometry, Material, Mesh, Scene } from 'three';
import { TransparentShader } from './Shaders';

export class DisplayManager {
    private state: IfcState;

    constructor(state: IfcState) {
        this.state = state;
    }

    setModelDisplay(modelID: number, state: Display, scene: Scene) {
        const mesh = this.state.models[modelID].mesh;
        const geometry = mesh.geometry;
        this.setupVisibility(geometry);

        const zeros = new Float32Array(geometry.getAttribute('position').count);

        if(state.r >= 0) geometry.setAttribute(VertexProps.r, new BufferAttribute(zeros.slice().fill(state.r), 1));
        if(state.g >= 0) geometry.setAttribute(VertexProps.g, new BufferAttribute(zeros.slice().fill(state.g), 1));
        if(state.b >= 0) geometry.setAttribute(VertexProps.b, new BufferAttribute(zeros.slice().fill(state.b), 1));
        if(state.a >= 0) geometry.setAttribute(VertexProps.a, new BufferAttribute(zeros.slice().fill(state.a), 1));
        if(state.h >= 0) geometry.setAttribute(VertexProps.h, new BufferAttribute(zeros.slice().fill(1), 1));

        this.updateAttributes(geometry);
        if (state.a != 1) this.setupTransparency(mesh, scene);
    }

    setItemsDisplay(modelID: number, ids: number[], state: Display, scene: Scene) {
        const mesh = this.state.models[modelID].mesh;
        const geometry = mesh.geometry;
        const current = mesh.modelID;
        this.setupVisibility(geometry);

        const faceIndicesArray = ids.map((id) => this.state.models[current].faces[id]);
        const faceIndices = ([] as number[]).concat(...faceIndicesArray);
        faceIndices.forEach((faceIndex) => this.setFaceDisplay(geometry, faceIndex, state));

        this.updateAttributes(geometry);
        if (state.a != 1) this.setupTransparency(mesh, scene);
    }

    setupVisibility(geometry: BufferGeometry) {
        if (!geometry.attributes[VertexProps.r]) {
            const zeros = new Float32Array(geometry.getAttribute('position').count);
            geometry.setAttribute(VertexProps.r, new BufferAttribute(zeros.slice(), 1));
            geometry.setAttribute(VertexProps.g, new BufferAttribute(zeros.slice(), 1));
            geometry.setAttribute(VertexProps.b, new BufferAttribute(zeros.slice(), 1));
            geometry.setAttribute(VertexProps.a, new BufferAttribute(zeros.slice().fill(1), 1));
            geometry.setAttribute(VertexProps.h, new BufferAttribute(zeros, 1));
        }
    }

    private updateAttributes(geometry: BufferGeometry) {
        Object.values(VertexProps).forEach((val) => (geometry.attributes[val].needsUpdate = true));
    }

    private setFaceDisplay(geometry: BufferGeometry, index: number, state: Display) {
        if (!geometry.index) return;
        const geoIndex = geometry.index.array;
        if(state.r >= 0) this.setFaceAttr(geometry, VertexProps.r, state.r, index, geoIndex);
        if(state.g >= 0) this.setFaceAttr(geometry, VertexProps.g, state.g, index, geoIndex);
        if(state.b >= 0) this.setFaceAttr(geometry, VertexProps.b, state.b, index, geoIndex);
        if(state.a >= 0) this.setFaceAttr(geometry, VertexProps.a, state.a, index, geoIndex);
        if(state.h >= 0) this.setFaceAttr(geometry, VertexProps.h, state.h, index, geoIndex);
    }

    private setFaceAttr(
        geom: BufferGeometry,
        attr: string,
        state: number,
        index: number,
        geoIndex: ArrayLike<number>
    ) {
        geom.attributes[attr].setX(geoIndex[3 * index], state);
        geom.attributes[attr].setX(geoIndex[3 * index + 1], state);
        geom.attributes[attr].setX(geoIndex[3 * index + 2], state);
    }

    private setupTransparency(ifcMesh: IfcMesh, scene: Scene) {
        const mesh = ifcMesh as TransparentMesh;
        if (mesh.transparentMesh) return;
        const transMesh = mesh.clone();

        const transparentMaterials: Material[] = [];

        if (Array.isArray(transMesh.material)) {
            transMesh.material.forEach((mat) => {
                transparentMaterials.push(this.newTransparent(mat));
            });
            transMesh.material = transparentMaterials;
        } else {
            transMesh.material = this.newTransparent(transMesh.material);
        }

        scene.add(transMesh);
        mesh.transparentMesh = transMesh;
    }

    private newTransparent(mat: Material) {
        const newMat = mat.clone();
        newMat.transparent = true;
        newMat.depthTest = false;
        newMat.onBeforeCompile = TransparentShader;
        return newMat;
    }
}
