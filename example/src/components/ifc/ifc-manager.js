import { IFCLoader } from '../../../../dist/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

export class IfcManager {
    constructor(scene, ifcModels) {
        this.scene = scene;
        this.ifcModels = ifcModels;
        this.ifcLoader = new IFCLoader();
        this.setupThreeMeshBVH();
        this.setupFileOpener();
    }

    setupThreeMeshBVH() {
        this.ifcLoader.ifcManager.setupThreeMeshBVH(
            computeBoundsTree,
            disposeBoundsTree,
            acceleratedRaycast
        );
    }

    setupFileOpener() {
        const input = document.querySelector('input[type="file"]');
        if (!input) return;
        input.addEventListener(
            'change',
            (changed) => {
                this.loadIFC(changed);
            },
            false
        );
    }

    releaseMemory() {
        this.ifcLoader.ifcManager.disposeMemory();
    }

    loadJSONData(modelID, data) {
        this.ifcLoader.ifcManager.useJSONData();
        this.ifcLoader.ifcManager.addModelJSONData(modelID, data);
    }

    async loadIFC(changed) {
        const ifcURL = URL.createObjectURL(changed.target.files[0]);
        const ifcModel = await this.ifcLoader.loadAsync(ifcURL);
        this.ifcModels.push(ifcModel);
        this.scene.add(ifcModel);
        ifcModel.position.x = 1;
    }
}

