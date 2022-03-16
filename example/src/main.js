import {Picker} from './components/picker/picker';
import { ThreeScene } from './components/scene/scene';
import { IfcManager } from './components/ifc/ifc-manager';

const ifcModels = [];
const baseScene = new ThreeScene();
const picker = new Picker(baseScene, ifcModels);
const loader = new IfcManager(baseScene.scene, ifcModels);

const testButton = document.getElementById("test-button");
testButton.onclick = async function (){ 
    loader.ifcLoader.ifcManager.byId(0, "IfcTask")
  }