import {Picker} from './components/picker/picker';
import { ThreeScene } from './components/scene/scene';
import { IfcManager } from './components/ifc/ifc-manager';
import { IFCFLOWSEGMENT, IFCWALLSTANDARDCASE } from 'web-ifc';

const ifcModels = [];
const baseScene = new ThreeScene();
const picker = new Picker(baseScene, ifcModels);
const loader = new IfcManager(baseScene.scene, ifcModels);


let toggle = true;

window.ondblclick = () => {
    // const geometry = ifcModels[0].mesh.geometry;
    //
    // for(let i = 0; i < geometry.attributes.expressID.count; i++){
    //     geometry.attributes.position.array[i] = 0;
    // }
    //
    // geometry.attributes.position.needsUpdate = true;
    // console.log(geometry);

    // const walls = loader.ifcLoader.ifcManager.getAllItemsOfType(0, IFCFLOWSEGMENT, false);
    // loader.ifcLoader.ifcManager.hideItems(0, walls);

    // toggle
    //     ? loader.ifcLoader.ifcManager.hideAllItems(0)
    //     : loader.ifcLoader.ifcManager.showAllItems(0);
    //
    // toggle = !toggle;

    let current = loader.ifcLoader.ifcManager.getSpatialStructure(0);
    while(!current.type.includes("IFCBUILDINGSTOREY")){
        current = current.children[0];
    }

    const items = current.children.map(c => c.expressID);

    toggle
        ? loader.ifcLoader.ifcManager.hideItems(0, items)
        : loader.ifcLoader.ifcManager.showItems(0, items);

    toggle = !toggle;
}
