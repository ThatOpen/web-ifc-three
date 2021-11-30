import { BufferGeometry, Mesh, MeshBasicMaterial } from 'three';

export class ItemSelector {
    constructor(scene, ifcModels, raycaster, highlightMaterial) {
        this.scene = scene;
        this.ifcModels = ifcModels;
        this.raycaster = raycaster;
        this.previousSelectedFace = null;
        this.previousSelection = null;
        this.material = highlightMaterial;
        this.currentItemID = -1;
        this.currentModel = null;

        this.geom = new BufferGeometry();

        this.material = new MeshBasicMaterial({ color: 'red', depthTest: false, transparent: true });
        const cube = new Mesh(this.geom, this.material);
        this.cube = cube;
        this.previousObject = cube;
        this.scene.add(cube);

        this.mapCache = {};
        this.indexCache = null;

        // Geometry Caching
        this.geomCacheEnabled = false;
        this.cacheThresold = 40000;
        this.geomCache = {};

        window.addEventListener('keydown', async (e) => {
            if (e.code === 'KeyA') {
                const ids = [];

                const collectIDs = (node) => {
                    ids.push(node.expressID);
                    if (node.children) node.children.forEach(collectIDs);
                };
                const structure = await this.ifcModels[0].ifcManager.getSpatialStructure(0);
                collectIDs(structure);

                const t0 = performance.now();
                this.ifcModels[0].ifcManager.createSubset({
                    modelID: 0,
                    scene: this.ifcModels[0],
                    ids: ids,
                    removePrevious: true
                    // material: this.material
                });
                const t1 = performance.now();
                console.log(`Subset took ${t1 - t0} milliseconds.`);
            }
        });

        this.subsetSelection = [];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async select(event, logTree = false, logProps = false, removePrevious = true) {
        const geometries = this.raycaster.cast(event);
        if (geometries.length <= 0) return;
        const item = geometries[0];
        if (this.previousSelectedFace === item.faceIndex) return;
        this.previousSelectedFace = item.faceIndex;
        await this.getModelAndItemID(item);
        this.highlightModel(removePrevious);
        if (logTree) await this.logTree();
        if (logProps) await this.logProperties();
    }

    previousObject = null;

    highlightModel(removePrevious) {
        this.currentModel.ifcManager.createSubset({
            modelID: this.currentModel.modelID,
            scene: this.currentModel,
            ids: [this.currentItemID],
            removePrevious: removePrevious,
            material: this.material
        });
    }

    async logTree() {
        const tree = await this.currentModel.ifcManager.getSpatialStructure(0);
        console.log(tree);
    }

    async logProperties() {
        const modelID = this.currentModel.modelID;
        const id = this.currentItemID;
        const props = await this.currentModel.ifcManager.getItemProperties(modelID, id);
        props.psets = await this.currentModel.ifcManager.getPropertySets(modelID, id);
        props.mats = await this.currentModel.ifcManager.getMaterialsProperties(modelID, id);
        props.type = await this.currentModel.ifcManager.getTypeProperties(modelID, id);
        console.log(props);
    }

    async getModelAndItemID(item) {
        const modelID = item.object.modelID;
        this.currentModel = this.ifcModels.find(model => model.modelID === modelID);
        if (!this.currentModel) {
            throw new Error('The selected item doesn\'t belong to a model!');
        }
        this.currentItemID = await this.currentModel.ifcManager.getExpressId(item.object.geometry, item.faceIndex);
    }

    removePreviousSelection() {
        const isNotPreviousSelection = this.previousSelection.modelID !== this.currentModel.modelID;
        if (this.previousSelection && isNotPreviousSelection) {
            this.previousSelection.removeSubset(this.scene, this.material);
        }
        this.previousSelection = this.currentModel;
    }
}