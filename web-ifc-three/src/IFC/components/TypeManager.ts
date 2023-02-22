import { IfcState } from '../BaseDefinitions';
import { IFCWorkerHandler } from '../web-workers/IFCWorkerHandler';

/**
 * Contains the logic to manage the type (e. g. IfcWall, IfcWindow, IfcDoor) of
 * all the items within an IFC file.
 */
export class TypeManager {

    constructor(private state: IfcState) {
        this.state = state;
    }

    async getAllTypes(worker?: IFCWorkerHandler){
		for (let modelID in this.state.models) {
			if (this.state.models.hasOwnProperty(modelID)) {
				const types = this.state.models[modelID].types;
				if (Object.keys(types).length == 0) {
					await this.getAllTypesOfModel(parseInt(modelID), worker);
				}
			}
		}
    }

    async getAllTypesOfModel(modelID: number, worker?: IFCWorkerHandler) {
        const result = {};
        const elements = await this.state.api.GetIfcEntityList(modelID);
        for(let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const lines = await this.state.api.GetLineIDsWithType(modelID, element);
            const size = lines.size();
            //@ts-ignore
            for (let i = 0; i < size; i++) result[lines.get(i)] = element;
        }
        if(this.state.worker.active && worker) {
            // TODO: When using web workers, store the type information there and request it to the worker
            // Otherwise the type data is stored in 2 different places at the same time
            await worker.workerState.updateModelStateTypes(modelID, result);
        }
        this.state.models[modelID].types = result;
    }
}
