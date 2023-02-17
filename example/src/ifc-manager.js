import {Matrix4} from 'three';
import {IFCLoader} from 'web-ifc-three/dist/IFCLoader';
import {acceleratedRaycast, computeBoundsTree, disposeBoundsTree} from 'three-mesh-bvh';
import {IFCWALLSTANDARDCASE, IFCSLAB, IFCWINDOW, IFCSPACE, IFCOPENINGELEMENT} from 'web-ifc';
import {downloadZip} from "client-zip";

export class IfcManager {
    constructor(scene, ifcModels) {
        this.scene = scene;
        this.ifcModels = ifcModels;
        this.ifcLoader = new IFCLoader();
        this.setupIfcLoader();
        this.setupFileOpener();
    }

    remove = false;

    async editSubset(type) {
        const ids = await this.ifcLoader.ifcManager.getAllItemsOfType(0, type, false);
        if (this.remove) this.ifcLoader.ifcManager.removeFromSubset(0, ids);
        else this.ifcLoader.ifcManager.createSubset({modelID: 0, ids, applyBVH: false, removePrevious: false})
    }

    setupThreeMeshBVH() {
        this.ifcLoader.ifcManager.setupThreeMeshBVH(
            computeBoundsTree,
            disposeBoundsTree,
            acceleratedRaycast
        );
    }

    async setupIfcLoader() {

        await this.ifcLoader.ifcManager.parser.setupOptionalCategories({
            [IFCSPACE]: false,
            [IFCOPENINGELEMENT]: false
        });

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

    async dispose() {
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
            USE_FAST_BOOLS: true
        });

        const ifcModel = await this.ifcLoader.loadAsync(ifcURL);

        if (firstModel) {
            const matrixArr = await this.ifcLoader.ifcManager.ifcAPI.GetCoordinationMatrix(ifcModel.modelID);
            const matrix = new Matrix4().fromArray(matrixArr);
            this.ifcLoader.ifcManager.setupCoordinationMatrix(matrix);
        }

        this.ifcModels.push(ifcModel);
        this.scene.add(ifcModel);

        const stop = window.performance.now()

        console.log(`Time Taken to load = ${(stop - start) / 1000} seconds`);
    }

    async downloadFragment(model) {

        const files = [];
        for (const frag of model.fragments) {
            const file = await frag.export();
            files.push(file.geometry, file.data);
        }

        const serializer = this.ifcLoader.ifcManager.properties.serializer;
        const propertyBlob = await serializer.serializeAllProperties(model.modelID);
        const propertyFile = new File(propertyBlob, "properties.json");

        files.push(new File([JSON.stringify(model.levelRelationships)], 'levels-relationship.json'));
        files.push(new File([JSON.stringify(model.itemTypes)], 'model-types.json'));
        files.push(new File([JSON.stringify(model.allTypes)], 'all-types.json'));
        files.push(new File([JSON.stringify(model.floorsProperties)], 'levels-properties.json'));

        const blob = await downloadZip(files).blob();
        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "test.zip";
        link.click();

        link.href = URL.createObjectURL(propertyFile);
        link.download = "properties.json";
        link.click();

        link.remove();
    }
}