import {Picker} from './components/picker/picker';
import { ThreeScene } from './components/scene/scene';
import { IfcManager } from './components/ifc/ifc-manager';

const ifcModels = [];
const baseScene = new ThreeScene();
const picker = new Picker(baseScene, ifcModels);
const loader = new IfcManager(baseScene.scene, ifcModels);

// reset scene
window.addEventListener('keydown', async (event) => {
    if(event.code === 'KeyF') {
        await loader.dispose();
        await picker.dispose();
    }
})