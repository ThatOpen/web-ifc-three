import { IFCLoader } from 'web-ifc-three/dist/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

export class IfcManager {
    constructor(scene, ifcModels) {
        this.scene = scene;
        this.ifcModels = ifcModels;
        this.ifcLoader = new IFCLoader();
        this.ifcLoader.ifcManager.applyWebIfcConfig({
            COORDINATE_TO_ORIGIN: true
        })
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

        const t0 = performance.now();
        const structure = this.ifcLoader.ifcManager.getSpatialStructure(ifcModel.modelID);
        const t1 = performance.now();
        console.log(`Call to get spatial took ${t1 - t0} milliseconds.`);
        console.log(structure);

        const t00 = performance.now();
        const structureWithProps = this.ifcLoader.ifcManager.getSpatialStructure(ifcModel.modelID, true);
        const t11 = performance.now();
        console.log(`Call to get spatial with props took ${t11 - t00} milliseconds.`);
        console.log(structureWithProps);

    }
}