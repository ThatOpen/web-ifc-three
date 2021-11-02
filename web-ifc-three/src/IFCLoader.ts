import { IFCManager } from './IFC/components/IFCManager';
import {FileLoader, Loader, LoadingManager, Matrix4} from 'three';
import { IFCModel } from './IFC/components/IFCModel';

class IFCLoader extends Loader {
    ifcManager: IFCManager;
    private onProgress?: (event: ProgressEvent) => void;

    constructor(manager?: LoadingManager) {
        super(manager);
        this.ifcManager = new IFCManager();
    }

    load(
        url: any,
        onLoad: (ifc: IFCModel) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
    ) {
        const scope = this;

        const loader = new FileLoader(scope.manager);
        this.onProgress = onProgress;
        loader.setPath(scope.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(scope.requestHeader);
        loader.setWithCredentials(scope.withCredentials);
        loader.load(
            url,
            async function (buffer) {
                try {
                    if (typeof buffer == 'string') {
                        throw new Error('IFC files must be given as a buffer!');
                    }
                    onLoad(await scope.parse(buffer));
                } catch (e: any) {
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
