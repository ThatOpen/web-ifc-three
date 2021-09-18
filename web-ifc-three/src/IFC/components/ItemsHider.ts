import { IfcState } from '../BaseDefinitions';

export class ItemsHider {
    private state: IfcState;
    private modelCoordinates: { [modelID: number]: Float32Array } = {};
    private expressIDCoordinatesMap: {
        [modelID: number]: {
            [id: number]: number[];
        }
    } = {};

    constructor(state: IfcState) {
        this.state = state;
    };

    dispose() {
        this.modelCoordinates = {};
        this.expressIDCoordinatesMap = {};
    }

    processCoordinates(modelID: number) {
        const attributes = this.getAttributes(modelID);
        const ids = Array.from(attributes.expressID.array);
        this.expressIDCoordinatesMap[modelID] = {};
        for (let i = 0; i < ids.length; i++) {
            if (!this.expressIDCoordinatesMap[modelID][ids[i]]) {
                this.expressIDCoordinatesMap[modelID][ids[i]] = [];
            }
            const current = this.expressIDCoordinatesMap[modelID];
            current[ids[i]].push(3 * i);
        }
        this.initializeCoordinates(modelID);
    }

    hideItems(modelID: number, ids: number[]) {
        this.editCoordinates(modelID, ids, true);
    }

    showItems(modelID: number, ids: number[]) {
        this.editCoordinates(modelID, ids, false);
    }

    editCoordinates(modelID: number, ids: number[], hide: boolean) {
        const current = this.expressIDCoordinatesMap[modelID];
        const indices: number[] = [];
        ids.forEach((id: number) => {
            if (current[id]) {
                for (let i = 0; i < current[id].length; i++) {
                    indices.push(current[id][i]);
                }
            }
        });
        const coords = this.getCoordinates(modelID);
        const initial = this.modelCoordinates[modelID];
        if (hide) indices.forEach(i => coords.set([0, 0, 0], i));
        else indices.forEach(i => coords.set([initial[i], initial[i + 1], initial[i+2]], i));

        this.getAttributes(modelID).position.needsUpdate = true;
    }

    showAllItems(modelID: number) {
        if (this.modelCoordinates[modelID]) {
            this.resetCoordinates(modelID);
            this.getAttributes(modelID).position.needsUpdate = true;
        }
    }

    hideAllItems(modelID: number) {
        this.getCoordinates(modelID).fill(0);
        this.getAttributes(modelID).position.needsUpdate = true;
    }

    private initializeCoordinates(modelID: number) {
        const coordinates = this.getCoordinates(modelID);
        if (!this.modelCoordinates[modelID]) {
            this.modelCoordinates[modelID] = new Float32Array(coordinates);
        }
    }

    private resetCoordinates(modelID: number) {
        const initial = this.modelCoordinates[modelID];
        this.getCoordinates(modelID).set(initial);
    }

    private getCoordinates(modelID: number) {
        return this.getAttributes(modelID).position.array as Float32Array;
    }

    private getAttributes(modelID: number) {
        return this.state.models[modelID].mesh.geometry.attributes;
    }
}