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
            if(Object.keys(types).length == 0) this.getAllTypesOfModel(parseInt(modelID));
        }
    }

    getAllTypesOfModel(modelID: number) {
        this.state.models[modelID].types;
        const elements = Object.keys(IfcElements).map((e) => parseInt(e));
        const types = this.state.models[modelID].types; 
        elements.forEach((type) => {
            const lines = this.state.api.GetLineIDsWithType(modelID, type);
            //@ts-ignore
            for (let i = 0; i < lines.size(); i++) types[lines.get(i)] = type;
        });
    }
}
