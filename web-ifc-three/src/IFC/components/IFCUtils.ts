import { IfcState } from '../BaseDefinitions';

export class IFCUtils {
    
    map: {[key: string]: number} = {};

    constructor(public state: IfcState) {}

    isA(entity: any, entity_class: string){
        var test = false;
        if (entity_class){
            if (this.state.api.GetNameFromTypeCode(entity.type) === entity_class.toUpperCase()){
                test = true;
            }
            return test
        }
        else {
            return this.state.api.GetNameFromTypeCode(entity.type);
        }
    }

    async byId (modelID: number, id: number) {
        return this.state.api.GetLine(modelID, id);
    }

    async idsByType(modelID: number, entity_class: string){
        let entities_ids = await this.state.api.GetLineIDsWithType(modelID, Number(this.state.api.GetTypeCodeFromName(entity_class.toUpperCase())));
        return entities_ids
    }

    async byType(modelID:number, entity_class:string){
        let entities_ids = await this.idsByType(modelID, entity_class) 
        if (entities_ids !== null){
            let items: number[] = [];
            for (let i = 0; i < entities_ids.size(); i++){
                let entity = await this.byId(modelID, entities_ids.get(i))
                items.push(entity);
            } 
            return items;
        }
    }
}
