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

    /**
     * Loads an IFC file from a given URL.
     * @param url URL of the IFC file or blob URL.
     * @param onLoad Callback when the IFC model is loaded.
     * @param onProgress Optional progress callback.
     * @param onError Optional error callback.
     */
    load(
        url: any,
        onLoad: (ifc: IFCModel) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
    ) {
        const scope = this;

        // Detect JSON files and provide a helpful error message.
        // Users often try to load JSON files (produced by ifc-to-json) directly,
        // but web-ifc-three only supports binary IFC files for geometry.
        const urlString = typeof url === 'string' ? url : '';
        if (urlString.endsWith('.json')) {
            const error = new Error(
                'Cannot load ".json" files directly with IFCLoader. ' +
                'The IFCLoader is designed to load binary IFC files (.ifc) for geometry. ' +
                'If you are trying to load a JSON file produced by "ifc-to-json", ' +
                'please note that JSON files contain property/metadata only (not geometry) ' +
                'and must be loaded alongside an IFC file using addModelJSONData(). ' +
                'See the documentation for the correct workflow: ' +
                'https://ifcjs.github.io/info/docs/Guide/web-ifc/Introduction'
            );
            if (onError) {
                onError(error);
            } else {
                console.error(error);
            }
            scope.manager.itemError(url);
            return;
        }

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
