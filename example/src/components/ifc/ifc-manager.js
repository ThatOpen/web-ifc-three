import { Matrix4, MeshBasicMaterial } from 'three';
import { IFCLoader } from 'web-ifc-three/dist/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { IFCWALLSTANDARDCASE, IFCSLAB, IFCWINDOW, IFCSPACE, IFCOPENINGELEMENT } from 'web-ifc';

export class IfcManager {
    constructor(scene, ifcModels) {
        this.scene = scene;
        this.ifcModels = ifcModels;
        this.ifcLoader = new IFCLoader();
        this.setupIfcLoader();
        this.setupFileOpener();

        window.addEventListener('keydown', async (event) => {
            if(event.code === 'KeyX') {
               this.remove = !this.remove;
            }
            if(event.code === 'KeyB') {
                await this.editSubset(IFCWALLSTANDARDCASE);
            }
            if(event.code === 'KeyC') {
                await this.editSubset(IFCSLAB);
            }
            if(event.code === 'KeyD') {
                await this.editSubset(IFCWINDOW);
            }
            if(event.code === 'KeyF') {
                await this.releaseMemory();
            }
        })
    }

    remove = false;

    async editSubset(type) {
        const ids = await this.ifcLoader.ifcManager.getAllItemsOfType(0, type, false);
        if(this.remove) this.ifcLoader.ifcManager.removeFromSubset(0, ids);
        else this.ifcLoader.ifcManager.createSubset({modelID: 0, ids, applyBVH: false, removePrevious: false })
    }

    setupThreeMeshBVH() {
        this.ifcLoader.ifcManager.setupThreeMeshBVH(
            computeBoundsTree,
            disposeBoundsTree,
            acceleratedRaycast
        );
    }

    async setupIfcLoader() {
        // await this.ifcLoader.ifcManager.useWebWorkers(true, 'IFCWorker.js');
        this.setupThreeMeshBVH();
    }

    setupFileOpener() {
        const input = document.querySelector('input[type="file"]');
        if (!input) return;
        input.addEventListener(
            'change',
            async (changed) => {
                await this.loadIFC(changed);
            },
            false
        );
    }

    async releaseMemory() {
        this.ifcModels.length = 0;
        await this.ifcLoader.ifcManager.dispose();
        this.ifcLoader = null;
        this.ifcLoader = new IFCLoader();
        await this.setupIfcLoader();
    }

    subset = {};

    async loadIFC(changed) {

        const start = window.performance.now()

        const ifcURL = URL.createObjectURL(changed.target.files[0]);
        this.ifcLoader.ifcManager.setOnProgress((event) => console.log(event));

        const firstModel = Boolean(this.ifcModels.length === 0);

        await this.ifcLoader.ifcManager.applyWebIfcConfig({
            COORDINATE_TO_ORIGIN: firstModel,
            USE_FAST_BOOLS: false
        });

        const ifcModel = await this.ifcLoader.loadAsync(ifcURL);
        // console.log(ifcModel);

        if(firstModel){
            const matrixArr = await this.ifcLoader.ifcManager.ifcAPI.GetCoordinationMatrix(ifcModel.modelID);
            const matrix = new Matrix4().fromArray(matrixArr);
            this.ifcLoader.ifcManager.setupCoordinationMatrix(matrix);
        }

        this.ifcModels.push(ifcModel);
        this.scene.add(ifcModel);

        const stop = window.performance.now()

        console.log(`Time Taken to load = ${(stop - start)/1000} seconds`);
    }
}