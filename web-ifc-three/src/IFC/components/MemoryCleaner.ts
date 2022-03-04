import { IfcState } from '../BaseDefinitions';
import { Material } from 'three';

export class MemoryCleaner {
    constructor(private state: IfcState) {
    }

    async dispose() {

        Object.keys(this.state.models).forEach(modelID => {
            const model = this.state.models[parseInt(modelID, 10)];
            model.mesh.removeFromParent();
            const geom = model.mesh.geometry as any;
            if(geom.disposeBoundsTree) geom.disposeBoundsTree();
            geom.dispose();
            (model.mesh.material as Material[]).forEach(mat => mat.dispose());
            (model.mesh as any) = null;
            (model.types as any) = null;
            (model.jsonData as any) = null;
        });

        (this.state.api as any) = null;
        (this.state.models as any) = null;
    }
}