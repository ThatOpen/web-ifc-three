import {Picker} from './components/picker/picker';
import { ThreeScene } from './components/scene/scene';
import { IfcManager } from './components/ifc/ifc-manager';
import { IFCWALLSTANDARDCASE } from 'web-ifc';

const ifcModels = [];
const baseScene = new ThreeScene();
const picker = new Picker(baseScene, ifcModels);
const loader = new IfcManager(baseScene.scene, ifcModels);

window.onkeydown = (event) => {
    if(event.code === "KeyB") {
        console.log(loader.ifcLoader.ifcManager.getSpatialStructure(0));
    }

    if(event.code === "KeyA") {
        loader.releaseMemory();
        console.log("Released!");

        fetch('./basic.json')
            .then(response => response.json())
            .then(data => {
                console.log(data);
                loader.loadJSONData(0, data);
            });
    }
}
