import { IfcState } from '../../BaseDefinitions';
import { IFCUtils } from '../IFCUtils'

export class Data {
    isLoaded = false;
    workPlans: {[key: number]: any} = {}
    workSchedules: {[key: number]: any} = {}
    workCalendars: {[key: number]: any} = {}
    workTimes: {[key: number]: any} = {}
    recurrencePatterns: {[key: number]: any} = {}
    timePeriods: {[key: number]: any} = {}
    tasks: {[key: number]: any} = {}
    taskTimes: {[key: number]: any} = {}
    lagTimes: {[key: number]: any} = {}
    sequences: {[key: number]: any} = {}
    utils: any;

    constructor(public state: IfcState) {
        this.utils = new IFCUtils(this.state);

    }

    //TO DO: Refactor to retrieve top-level task from a workschedule entity, and then load tasks.
    // Currently only tasks are retrieved. 
    async load(modelID: number){
        await this.loadTasks(modelID)
        await this.loadWorkSchedules(modelID)
        await this.loadWorkCalendars(modelID)
        await this.loadWorkTimes(modelID)
        await this.loadTimePeriods(modelID)
        this.isLoaded = true

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
                "Name": ((task.Name) ? task.Name.value : ""),
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
                "HasAssignmentsWorkCalendars": [],
            }
        }
        await this.loadTaskSequence(modelID)
        await this.loadTaskOutputs(modelID)
        await this.loadTaskNesting(modelID)
        await this.loadTaskOperations(modelID)
        await this.loadAssignementsWorkCalendar(modelID)
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
            let relatedObject = await this.utils.byId(modelID, relAssignsToProduct.RelatedObjects[0].value); 
            if (this.utils.isA(relatedObject, "IfcTask")) {
                let relatingProduct = await this.utils.byId(modelID, relAssignsToProduct.RelatingProduct.value);
                this.tasks[relatedObject.expressID]["Outputs"].push(relatingProduct.expressID);
            }
        }
    }

    async loadTaskNesting(modelID: number){
        let rels_nests = await this.utils.byType(modelID, "IfcRelNests");
        for (let i = 0; i < rels_nests.length; i++){
            let relNests = rels_nests[i];
            let relating_object = await this.utils.byId(modelID, relNests.RelatingObject.value);
            if (this.utils.isA(relating_object, "IfcTask")) {
                let relatedObjects = relNests.RelatedObjects;
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
            if (this.utils.isA(relatingProcess, "IfcTask")) {
                let relatedObjects = relAssignToProcess.RelatedObjects;
                for (var object_index = 0; object_index < relatedObjects.length; object_index++) {
                    this.tasks[relatingProcess.expressID]["OperatesOn"].push(relatedObjects[object_index].value);
                }
            }
        }
    }

    async loadAssignementsWorkCalendar(modelID: number){
        let relsAssignsToControl = await this.utils.byType(modelID, "IfcRelAssignsToControl");
        for (let i = 0; i < relsAssignsToControl.length; i++){
            let relAssignsToControl = relsAssignsToControl[i];
            let relatingControl = await this.utils.byId(modelID, relAssignsToControl.RelatingControl.value);
            if (this.utils.isA(relatingControl, "IfcWorkCalendar")) {
                let relatedObjects = relAssignsToControl.RelatedObjects;
                for (var object_index = 0; object_index < relatedObjects.length; object_index++) {
                    this.tasks[relatedObjects[object_index].value]["HasAssignmentsWorkCalendars"].push(relatingControl.expressID);
                }
            }
        }
    }

    async loadWorkCalendars(modelID: number){
        let workCalendars = await this.utils.byType(modelID, "IfcWorkCalendar")
        for (let i = 0; i < workCalendars.length; i++){
            let workCalendar = workCalendars[i]
            let workCalenderData = {   
                "Id": workCalendar.expressID,
                "Name": ((workCalendar.Name) ? workCalendar.Name.value : ""),
                "Description": ((workCalendar.Description) ? workCalendar.Description.value : ""),
                "WorkingTimes": ((workCalendar.WorkingTimes) ? workCalendar.WorkingTimes : []),
                "ExceptionTimes": ((workCalendar.ExceptionTimes) ? workCalendar.ExceptionTimes : []),
            }
            this.workCalendars[workCalendar.expressID] = workCalenderData
        }
        // this.loadworkCalendarRelatedObjects(modelID)
    }    

    async loadWorkTimes(modelID: number){
        let workTimes = await this.utils.byType(modelID, "IfcWorkTime")
        for (let i = 0; i < workTimes.length; i++){
            let workTime = workTimes[i]
            let workTimeData = {   
                "Name": ((workTime.Name) ? workTime.Name.value : ""),
                "RecurrencePattern": ((workTime.RecurrencePattern) ? await this.utils.byId(modelID, workTime.RecurrencePattern.value) : ""), 
                "Start": ((workTime.Start) ? new Date(workTime.Start.value) : ""),
                "Finish": ((workTime.Finish) ? new Date(workTime.Finish.value) : ""),
            }
            this.workTimes[workTime.expressID] = workTimeData
        }
    }

    async loadTimePeriods(modelID: number){
        let timePeriods = await this.utils.byType(modelID, "IfcTimePeriod")
        for (let i = 0; i < timePeriods.length; i++){
            let timePeriod = timePeriods[i]
            let workTimeData = {   
                "StartTime": ((timePeriod.StartTime) ? new Date(timePeriod.StartTime.value) : ""),
                "EndTime": ((timePeriod.EndTime) ? new Date(timePeriod.EndTime.value) : ""),
            }
            this.timePeriods[timePeriod.expressID] = workTimeData
        }
    }    
}
