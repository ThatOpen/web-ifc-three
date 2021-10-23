import { IFCLoader } from 'web-ifc-three/dist/IFCLoader';
import { MeshLambertMaterial } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { IFCBUILDINGSTOREY, IFCSLAB } from 'web-ifc';

export class IfcManager {
    constructor(scene, ifcModels) {
        this.scene = scene;
        this.ifcModels = ifcModels;
        this.ifcLoader = new IFCLoader();
        this.setupIfcLoader();
    }

    setupThreeMeshBVH() {
        this.ifcLoader.ifcManager.setupThreeMeshBVH(
            computeBoundsTree,
            disposeBoundsTree,
            acceleratedRaycast
        );
    }

    async setupIfcLoader() {
        await this.ifcLoader.ifcManager.useWebWorkers(true, 'IFCWorker.js');
        this.ifcLoader.ifcManager.applyWebIfcConfig({
            COORDINATE_TO_ORIGIN: true,
            USE_FAST_BOOLS: false
        });
        this.setupThreeMeshBVH();
        this.setupFileOpener();
    }

    setupFileOpener() {
        const input = document.querySelector('input[type="file"]');
        if (!input) return;
        input.addEventListener(
            'change',
            async (changed) => {
                // await this.ifcLoader.ifcManager.useJSONData();
                await this.loadIFC(changed);
                // await this.ifcLoader.ifcManager.loadJsonDataFromWorker(0, '../../example/model/test.json');
            },
            false
        );
    }

    // TODO: CleanUp() method to realease webgl memory of IFCLoader
    releaseMemory() {
        this.ifcLoader.ifcManager.disposeMemory();
    }

    async loadIFC(changed) {
        const ifcURL = URL.createObjectURL(changed.target.files[0]);
        this.ifcLoader.ifcManager.setOnProgress((event) => console.log(event));
        const ifcModel = await this.ifcLoader.loadAsync(ifcURL);
        this.ifcModels.push(ifcModel);
        this.scene.add(ifcModel);
    }
}