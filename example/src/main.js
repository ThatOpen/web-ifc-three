import {Picker} from './components/picker/picker';
import { ThreeScene } from './components/scene/scene';
import { IfcManager } from './components/ifc/ifc-manager';
import { IfcWorkerHandler } from '../../web-ifc-three/dist/WorkerHandler';

const ifcModels = [];
const baseScene = new ThreeScene();
const picker = new Picker(baseScene, ifcModels);
const loader = new IfcManager(baseScene.scene, ifcModels);

// async function test() {
//     const worker = new IfcWorkerHandler('../web-ifc-three/dist/IFCWorker.js');
//     const result = await worker.Init();
//     console.log(result);
//     console.log("finish");
// }
//
// test();