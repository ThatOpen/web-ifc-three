import { IFCManager } from './IFC/Components/IFCManager';
import {
    BufferGeometry,
    FileLoader,
    Loader,
    LoadingManager,
    Material,
    Object3D,
    Scene
} from 'three';

// tslint:disable-next-line:interface-name
export interface IFC extends Object3D {
    [key: string]: any;
}

class IFCLoader extends Loader {
    private ifcManager: IFCManager;

    constructor(manager?: LoadingManager) {
        super(manager);
        this.ifcManager = new IFCManager();
    }

    load(
        url: any,
        onLoad: (ifc: IFC) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
    ) {
        const scope = this;

        const loader = new FileLoader(scope.manager);
        loader.setPath(scope.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(scope.requestHeader);
        loader.setWithCredentials(scope.withCredentials);
        loader.load(
            url,
            async function (buffer) {
                try {
                    if (typeof buffer == 'string'){
                        throw new Error('IFC files must be given as a buffer!');
                    }
                    onLoad(await scope.parse(buffer));
                } catch (e) {
                    if (onError) {
                        onError(e);
                    } else {
                        console.error(e);
                    }

                    scope.manager.itemError(url);
                }
            },
            onProgress,
            onError
        );
    }

    parse(buffer: ArrayBuffer) {
        return this.ifcManager.parse(buffer);
    }
}

export { IFCLoader };
