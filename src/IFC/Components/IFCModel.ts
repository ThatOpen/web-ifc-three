import { Group, Mesh, Scene } from 'three';
import { IFCManager } from './IFCManager';

export class IFCModel extends Group {
    constructor(public mesh: Mesh, public ifc: IFCManager) {
        super();
    }
}
