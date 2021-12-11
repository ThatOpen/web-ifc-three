import { Raycaster, Vector2 } from 'three';

export class RayCaster {
    constructor(camera, ifcModels) {
        this.raycaster = new Raycaster();
        this.raycaster.firstHitOnly = true;
        this.mouse = new Vector2();
        this.camera = camera;
        this.ifcModels = ifcModels
    }

    cast(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        return this.raycaster.intersectObjects(this.ifcModels);
    }
}