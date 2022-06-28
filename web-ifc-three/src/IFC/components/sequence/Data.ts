import { IfcState } from '../../BaseDefinitions';
import { IFCUtils } from '../IFCUtils'

export class Data {
    is_loaded = false;
    work_plans: {[key: number]: any} = {}
    workSchedules: {[key: number]: any} = {}
    work_calendars: {[key: number]: any} = {}
    work_times: {[key: number]: any} = {}
    recurrence_patterns: {[key: number]: any} = {}
    time_periods: {[key: number]: any} = {}
    tasks: {[key: number]: any} = {}
    task_times: {[key: number]: any} = {}
    lag_times: {[key: number]: any} = {}
    sequences: {[key: number]: any} = {}
    utils: any;

    constructor(public state: IfcState) {
        this.utils = new IFCUtils(this.state);

    }

    //TO DO: Refactor to retrieve top-level task from a workschedule entity, and then load tasks.
    // Currently only tasks are retrieved. 
    async load(modelID: number){
        await this.loadTasks(modelID)
        this.loadWorkSchedules(modelID)

    }


    async loadWorkSchedules(modelID: number){
        let workSchedules = await this.utils.byType(modelID, "IfcWorkSchedule")
        for (let i = 0; i < workSchedules.length; i++){
            let workSchedule = workSchedules[i]
            this.workSchedules[workSchedule.expressID] = {   
                "Id": workSchedule.expressID,
                "Name": workSchedule.Name.value,
                "Description": ((workSchedule.Description) ? workSchedule.Description.value : ""),
                "Creators": [], 
                "CreationDate": ((workSchedule.CreationDate) ? workSchedule.CreationDate.value : ""),
                "StartTime": ((workSchedule.StartTime) ? workSchedule.StartTime.value : ""),
                "FinishTime": ((workSchedule.FinishTime) ? workSchedule.FinishTime.value : ""),
                "TotalFloat": ((workSchedule.TotalFloat) ? workSchedule.TotalFloat.value : ""),
                "RelatedObjects": [],
            }
        }
        this.loadWorkScheduleRelatedObjects(modelID)
    }


    async loadWorkScheduleRelatedObjects(modelID: number){
        let relsControls = await this.utils.byType(modelID, "IfcRelAssignsToControl");
        console.log("Rel Controls:", relsControls)
        for (let i = 0; i < relsControls.length; i++){
            let relControls = relsControls[i];
            let relatingControl = await this.utils.byId(modelID, relControls.RelatingControl.value);
            let relatedObjects = relControls.RelatedObjects;
            if (this.utils.isA(relatingControl, "IfcWorkSchedule")) {
                for (var objectIndex = 0; objectIndex < relatedObjects.length; objectIndex++) {
                    this.workSchedules[relatingControl.expressID]["RelatedObjects"].push(relatedObjects[objectIndex].value);
                }
            }
        }
    }

    async loadTasks(modelID: number){
        let tasks = await this.utils.byType(modelID, "IfcTask")
        for (let i = 0; i < tasks.length; i++){
            let task = tasks[i]
            this.tasks[task.expressID] = {   
                "Id": task.expressID,
                "Name": task.Name.value,
                "PredefinedType": ((task.PredefinedType) ? task.PredefinedType.value : ""),
                "TaskTime": ((task.TaskTime) ? await this.utils.byId(modelID, task.TaskTime.value) : ""), 
                "Identification": ((task.Identification) ? task.Identification.value : ""),
                "IsMilestone": ((task.IsMilestone) ? task.IsMilestone.value : ""),
                "IsPredecessorTo": [],
                "IsSucessorFrom": [],
                "Inputs": [],
                "Resources": [],
                "Outputs": [],
                "Controls": [],
                "Nests": [],
                "IsNestedBy": [],
                "OperatesOn":[],
            }
        }
        await this.loadTaskSequence(modelID)
        await this.loadTaskOutputs(modelID)
        await this.loadTaskNesting(modelID)
        await this.loadTaskOperations(modelID)
    }

    async loadTaskSequence(modelID: number){
        let relsSequence = await this.utils.idsByType(modelID, "IfcRelSequence")
        for (let i = 0; i < relsSequence.size(); i++){
            let relSequenceId = relsSequence.get(i)
            if(relSequenceId !==0){
                let relSequence = await this.utils.byId(modelID, relSequenceId)
                let related_process = relSequence.RelatedProcess.value;
                let relatingProcess = relSequence.RelatingProcess.value;
                this.tasks[relatingProcess]["IsPredecessorTo"].push(relSequence.expressID)
                this.tasks[related_process]["IsSucessorFrom"].push(relSequence.expressID)
            }
        }
            
    }

    async loadTaskOutputs(modelID: number){
        let rels_assigns_to_product = await this.utils.byType(modelID, "IfcRelAssignsToProduct");
        for (let i = 0; i < rels_assigns_to_product.length; i++){
            let relAssignsToProduct = rels_assigns_to_product[i]
            let relatingProduct = await this.utils.byId(modelID, relAssignsToProduct.RelatingProduct.value);
            let relatedObject = await this.utils.byId(modelID, relAssignsToProduct.RelatedObjects[0].value); 
            if (this.utils.isA(relatedObject, "IfcTask")) {
                this.tasks[relatedObject.expressID]["Outputs"].push(relatingProduct.expressID);
            }
        }
    }

    async loadTaskNesting(modelID: number){
        let rels_nests = await this.utils.byType(modelID, "IfcRelNests");
        for (let i = 0; i < rels_nests.length; i++){
            let relNests = rels_nests[i];
            let relating_object = await this.utils.byId(modelID, relNests.RelatingObject.value);
            let relatedObjects = relNests.RelatedObjects;
            if (this.utils.isA(relating_object, "IfcTask")) {
                for (var object_index = 0; object_index < relatedObjects.length; object_index++) {
                    this.tasks[relating_object.expressID]["IsNestedBy"].push(relatedObjects[object_index].value);
                    this.tasks[relatedObjects[object_index].value]["Nests"].push(relating_object.expressID);
                }
            }
        }
    }

    async loadTaskOperations(modelID: number){
        let relsAssignsToProcess = await this.utils.byType(modelID, "IfcRelAssignsToProcess");
        for (let i = 0; i < relsAssignsToProcess.length; i++){
            let relAssignToProcess = relsAssignsToProcess[i];
            let relatingProcess = await this.utils.byId(modelID, relAssignToProcess.RelatingProcess.value);
            let relatedObjects = relAssignToProcess.RelatedObjects;
            if (this.utils.isA(relatingProcess, "IfcTask")) {
                for (var object_index = 0; object_index < relatedObjects.length; object_index++) {
                    this.tasks[relatingProcess.expressID]["OperatesOn"].push(relatedObjects[object_index].value);
                    console.log(relatingProcess.expressID);
                    console.log("Has Operations");
                }
            }
        }
    }
}
