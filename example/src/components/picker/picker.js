import { MeshLambertMaterial } from 'three';
import { RayCaster } from './raycaster';
import { ItemSelector } from './item-selector';

export class Picker {
    constructor(base, ifcModels) {
        this.pickMat = this.newMaterial(0.5, 0xff00ff);
        this.prePickMat = this.newMaterial(0.5, 0xffccff);
        this.caster = new RayCaster(base.camera, ifcModels);
        this.selector = new ItemSelector(base.scene, ifcModels, this.caster, this.pickMat);
        this.preSelector = new ItemSelector(base.scene, ifcModels, this.caster, this.prePickMat);
        this.setupPicking(base.threeCanvas);
    }

    dispose() {
        this.selector.dispose();
        this.preSelector.dispose();
    }

    setupPicking(threeCanvas){
        threeCanvas.ondblclick = (event) => this.selector.select(event, false, true);
        threeCanvas.onmousemove = (event) => this.preSelector.select(event);
    }

    newMaterial(opacity, color){
        return new MeshLambertMaterial({
            color,
            transparent: true,
            opacity,
            depthTest: false
        })
    }
}