import { IFCLoader } from 'web-ifc-three/dist/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

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
        await this.ifcLoader.ifcManager.useWebWorkers(true, "../../../web-ifc-three/dist/IFCWorker.js")
        await this.ifcLoader.ifcManager.useJSONData(true);
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
            (changed) => {
                fetch("ARK_NUS_skolebygg.json").then(response => response.json()).then(json => {

                    this.loadIFC(changed).then(() => {

                        this.ifcLoader.ifcManager.addModelJSONData(0, json);

                    })
                })
            },
            false
        );
    }

    releaseMemory() {
        this.ifcLoader.ifcManager.disposeMemory();
    }

    // TODO: CleanUp() method to realease webgl memory of IFCLoader

    loadJSONData(modelID, data) {
        this.ifcLoader.ifcManager.useJSONData();
        this.ifcLoader.ifcManager.addModelJSONData(modelID, data);
    }

    async loadIFC(changed) {
        const ifcURL = URL.createObjectURL(changed.target.files[0]);
        const ifcModel = await this.ifcLoader.loadAsync(ifcURL);
        this.ifcModels.push(ifcModel);
        this.scene.add(ifcModel);
    }
}