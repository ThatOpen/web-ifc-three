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
    }

    select(event, logTree = false, logProps = false, removePrevious = true) {
        const geometries = this.raycaster.cast(event);
        if (geometries.length <= 0) return;
        const item = geometries[0];
        if (this.previousSelectedFace === item.faceIndex) return;
        this.previousSelectedFace = item.faceIndex;
        this.getModelAndItemID(item);
        this.highlightModel(removePrevious);
        if(logTree) this.logTree();
        if(logProps) this.logProperties();
    }

    highlightModel(removePrevious){
        this.currentModel.ifcManager.createSubset({
            modelID: this.currentModel.modelID,
            scene: this.currentModel,
            ids: [this.currentItemID],
            removePrevious: removePrevious,
            material: this.material
        });
    }

    logTree(){
        const tree = this.currentModel.getSpatialStructure();
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

    getModelAndItemID(item){
        const modelID = item.object.modelID;
        this.currentModel = this.ifcModels.find(model => model.modelID === modelID);
        if (!this.currentModel) {
            throw new Error ("The selected item doesn't belong to a model!");
        }
        this.currentItemID = this.currentModel.ifcManager.getExpressId(item.object.geometry, item.faceIndex);
    }

    removePreviousSelection(){
        const isNotPreviousSelection = this.previousSelection.modelID !== this.currentModel.modelID;
        if (this.previousSelection && isNotPreviousSelection){
            this.previousSelection.removeSubset(this.scene, this.material);
        }
        this.previousSelection = this.currentModel;
    }
}