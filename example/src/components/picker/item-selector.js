import {BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial} from "three";

let firstTime = true;

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
        /*this.currentModel.ifcManager.createSubset({
            modelID: this.currentModel.modelID,
            scene: this.currentModel,
            ids: [this.currentItemID],
            removePrevious: removePrevious,
            material: this.material
        });*/

        if(!firstTime) return;
        firstTime = false;

        const expressID = this.currentItemID;
        const model = this.currentModel.ifcManager.state.models[0];
        console.log(model);

        const map = model.map;
        const geometry = model.mesh.geometry;
        const entry = map.get(expressID);
        console.log(entry);

        if (!geometry.index) throw new Error(`BufferGeometry is not indexed.`)
        if (!entry) throw new Error(`Entry for expressID: ${expressID} not found.`)

        const positions = [];
        const normals = [];
        const originalIndexSlice = [];
        const indexes = [];

        /*let smallestIndex = -1;

        for (const materialIndex in entry) {

            const index = Number.parseInt(materialIndex);
            const value = entry[index];
            const start = value[0];
            const end = value[1];

            for (let i = start; i < end; i++) {
                const index = geometry.index.array[i];
                if (smallestIndex === -1 || smallestIndex > index) smallestIndex = index;
            }
        }*/

        function getSmallestIndex(start, end){
            let smallestIndex = -1;

            for (let i = start; i < end; i++) {
                const index = geometry.index.array[i];
                if (smallestIndex === -1 || smallestIndex > index) smallestIndex = index;
            }

            return smallestIndex;
        }

        // console.log(`Smallest: ${smallestIndex}`);

        let counter = 0;

        for (const materialIndex in entry) {



            const index = Number.parseInt(materialIndex);
            const value = entry[index];

            const pairs = value.length / 2;

            console.log("Pairs: " + pairs);

            for (let pair = 0; pair < pairs; pair++){

                const paidIndex = pair * 2;
                const start = value[paidIndex];
                const end = value[paidIndex + 1];

                console.log("Pair: " + pair)

                const smallestIndex = getSmallestIndex(start, end);

                for (let i = start; i <= end; i++) {

                    const index = geometry.index.array[i];
                    const positionIndex = index * 3;

                    originalIndexSlice.push(index);
                    indexes.push(index - smallestIndex + counter);

                    const v1 = geometry.attributes.position.array[positionIndex];
                    const v2 = geometry.attributes.position.array[positionIndex + 1];
                    const v3 = geometry.attributes.position.array[positionIndex + 2];

                    const n1 = geometry.attributes.normal.array[positionIndex];
                    const n2 = geometry.attributes.normal.array[positionIndex + 1];
                    const n3 = geometry.attributes.normal.array[positionIndex + 2];

                    const newIndex = ((index - smallestIndex) + counter) * 3;

                    positions[newIndex] = v1;
                    positions[newIndex + 1] = v2;
                    positions[newIndex + 2] = v3;

                    normals[newIndex] = n1;
                    normals[newIndex + 1] = n2;
                    normals[newIndex + 2] = n3;
                }
            }



            counter = indexes.length;
        }

        const newGeom = new BufferGeometry();
        const positionNumComponents = 3;
        const normalNumComponents = 3;
        newGeom.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(positions), positionNumComponents));
        newGeom.setAttribute(
            'normal',
            new BufferAttribute(new Float32Array(normals), normalNumComponents));

        newGeom.setIndex(indexes);

        const cube = new Mesh(newGeom, new MeshBasicMaterial({ color: "red", depthTest: false,}));
        model.mesh.add(cube);

        if(this.previousObject){
            model.mesh.remove(this.previousObject);
        }
        this.previousObject = cube;

        // console.log(positions);
        // console.log(indexes)
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