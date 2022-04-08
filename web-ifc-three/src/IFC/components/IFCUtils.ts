import { IfcState } from '../BaseDefinitions';
import { IfcTypesMap } from './IfcTypesMap'

export class IFCUtils {
    
    map: {[key: string]: number} = {};

    constructor(public state: IfcState) {}

    getMapping(){
        this.map = this.reverseElementMapping(IfcTypesMap)
    }

    releaseMapping(){
        this.map = {}
    }

    reverseElementMapping(obj: {}) {
        let reverseElement = {};
        Object.keys(obj).forEach(key => {
            reverseElement[obj[key as any as keyof typeof obj]] = key as any as keyof typeof obj;
        })
        return reverseElement;
    }

    isA(entity: any, entity_class: string){
        var test = false;
        if (entity_class){
            if (IfcTypesMap[entity.type] === entity_class.toUpperCase()){
                test = true;
            }
            return test
        }
        else {
            return IfcTypesMap[entity.type]
        }
    }

    async byId (modelID: number, id: number) {
        return this.state.api.GetLine(modelID, id);
    }

    async idsByType(modelID: number, entity_class: string){
        this.getMapping()
        let entities_ids = await this.state.api.GetLineIDsWithType(modelID, Number(this.map[entity_class.toUpperCase()]) );
        this.releaseMapping()
        return entities_ids
    }

    async byType(modelID:number, entity_class:string){
        let entities_ids = await this.idsByType(modelID, entity_class) 
        if (entities_ids !== null){
            this.getMapping()
            let items: number[] = [];
            for (let i = 0; i < entities_ids.size(); i++){
                let entity = await this.byId(modelID, entities_ids.get(i))
                items.push(entity);
            } 
            this.releaseMapping()
            return items;
        }
    }
}
