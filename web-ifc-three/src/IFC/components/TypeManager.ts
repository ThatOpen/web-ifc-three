import { IfcState, SelectedItems } from '../BaseDefinitions';
import { IfcElements } from './IFCElementsMap'

/**
 * Contains the logic to manage the type (e. g. IfcWall, IfcWindow, IfcDoor) of
 * all the items within an IFC file.
 */
export class TypeManager {
    private state: IfcState;

    constructor(state: IfcState) {
        this.state = state;
    }

    getAllTypes(){
        for(let modelID in this.state.models){
            const types = this.state.models[modelID].types;
            if(Object.keys(types).length == 0) {
                this.getAllTypesOfModel(parseInt(modelID));
            }
        }
    }

    async getAllTypesOfModel(modelID: number) {
        this.state.models[modelID].types;
        const elements = Object.keys(IfcElements).map((e) => parseInt(e));
        const types = this.state.models[modelID].types;
        for(let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const lines = await this.state.api.GetLineIDsWithType(modelID, element);
            const size = lines.size();
            //@ts-ignore
            for (let i = 0; i < size; i++) types[lines.get(i)] = element;
        }
    }
}
