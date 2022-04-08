export class IFC2JSGANTT {
    taskData: {[key: string]: any} = {};
    jsWorkSchedule: Array<any> = []
    sequenceTypeMap: {[key: string]: string} = {}
    workSchedules: Array<number> = []

    constructor(public scheduleData: {[key: number]: any}) {
        this.setTaskSource(scheduleData)
    }

    //TO DO: Refactor to retrieve top-level task from a workschedule, and then load tasks.
    // Currently all tasks are retrieved and re-organised
    setTaskSource(source: {}){
        this.scheduleData = source
    }
    loadSequenceTypeMap(){
        this.sequenceTypeMap = {
            null: "FS",
            "START_START": "SS",
            "START_FINISH": "SF",
            "FINISH_START": "FS",
            "FINISH_FINISH": "FF",
            "USERDEFINED": "FS",
            "NOTDEFINED": "FS",
        }
    }
    purge(){
        this.sequenceTypeMap = {}
        this.taskData = {}
        this.workSchedules = []
    }

    getJsGanttTaskJson(){
        for (let taskID in this.scheduleData){
            this.createNewTaskJson(this.scheduleData, taskID)
        }
        this.purge()
        return JSON.stringify(this.jsWorkSchedule)
    }

    
    async createNewTaskJson(scheduleData: {[key: number]: any}, taskID: any) {
        this.loadSequenceTypeMap()
        let task = scheduleData[taskID]
        let data = {
          "pID": task.Id.toString(),
          "pName": task.Name,
          "pStart":  ((task.TaskTime !== "") ? task.TaskTime.ScheduleStart.value : "" ),
          "pEnd": ((task.TaskTime !== "") ? task.TaskTime.ScheduleFinish.value : "" ),
          "pPlanStart": ((task.TaskTime !== "") ? task.TaskTime.ScheduleStart.value : "" ),
          "pPlanEnd": ((task.TaskTime !== "") ? task.TaskTime.ScheduleFinish.value : "" ),
          "pComp": 0,
          "pMile": ((task.IsMilestone == "T") ? 1 : 0 ),
          "pGroup": ((task.IsNestedBy[0] > 0) ? 1 : 0 ), 
          "pParent": ((task.Nests[0] > 0 ) ? task.Nests[0] : 0),
          "pOpen": 1,
          "pCost": 1,
        } 
        if (task.TaskTime != "" && task.TaskTime.IsCritical != null && task.TaskTime.IsCritical.value == 'T') {
            data["pClass"] = "gtaskred"
        }
        else if (data["pGroup"] == 1 ) {
            data["pClass"] = "ggroupblack"
        }
        else if (task.IsMilestone == "T") {
            data["pClass"] = "gmilestone"
        }
        else {
            data["pClass"] = "gtaskblue"
        }
        if (task.IsSucessorFrom != null){
            for (let index in task.IsSucessorFrom){
                let relSequence = task.IsSucessorFrom[index].Rel
                let sequenceType = relSequence.SequenceType.value
                let relatingProcess = relSequence.RelatingProcess.value
                sequenceType = this.sequenceTypeMap[sequenceType]
                let relData = relatingProcess.toString().concat(sequenceType)
                data["thispDepend"] = relData
            }
        }
        this.jsWorkSchedule.push(data);
        for (let relatedObjectIndex in task.IsNestedBy){
            let taskID = task.IsNestedBy[relatedObjectIndex]
            await this.createNewTaskJson(scheduleData, taskID)
        }
    }
}
