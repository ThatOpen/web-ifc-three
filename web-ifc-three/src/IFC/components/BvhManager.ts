import { BufferGeometry, Mesh } from 'three';

export class BvhManager {
    private computeBoundsTree?: any;
    private disposeBoundsTree?: any;
    private acceleratedRaycast?: any;

    initializeMeshBVH(computeBoundsTree: any, disposeBoundsTree: any, acceleratedRaycast: any) {
        this.computeBoundsTree = computeBoundsTree;
        this.disposeBoundsTree = disposeBoundsTree;
        this.acceleratedRaycast = acceleratedRaycast;
        this.setupThreeMeshBVH();
    }

    applyThreeMeshBVH(geometry: BufferGeometry) {
        if (this.computeBoundsTree)
            //@ts-ignore
            geometry.computeBoundsTree();
    }

    private setupThreeMeshBVH() {
        if (!this.computeBoundsTree || !this.disposeBoundsTree || !this.acceleratedRaycast) return;
        //@ts-ignore
        BufferGeometry.prototype.computeBoundsTree = this.computeBoundsTree;
        //@ts-ignore
        BufferGeometry.prototype.disposeBoundsTree = this.disposeBoundsTree;
        Mesh.prototype.raycast = this.acceleratedRaycast;
    }
}