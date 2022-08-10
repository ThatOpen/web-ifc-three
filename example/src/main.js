import { ThreeScene } from './scene';
import { IfcManager } from './ifc-manager';

const ifcModels = [];
const baseScene = new ThreeScene();
const loader = new IfcManager(baseScene.scene, ifcModels);