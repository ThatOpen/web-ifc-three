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
                    // Diagnose JSON payloads even when a blob URL has no filename.
                    const bytes = new Uint8Array(buffer);
                    let offset = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
                    while (offset < bytes.length && (
                        bytes[offset] === 0x20 || bytes[offset] === 0x09 ||
                        bytes[offset] === 0x0a || bytes[offset] === 0x0d
                    )) offset++;
                    if (bytes[offset] === 0x7b || bytes[offset] === 0x5b) {
                        throw new Error(
                            'Cannot load JSON object or array data directly with IFCLoader. ' +
                            'The IFCLoader is designed to load IFC files (.ifc) for geometry. ' +
                            'If you are trying to load a JSON file produced by "ifc-to-json", ' +
                            'please note that JSON files contain property/metadata only (not geometry) ' +
                            'and must be loaded alongside an IFC file using addModelJSONData(). ' +
                            'See the documentation for the correct workflow: ' +
                            'https://ifcjs.github.io/info/docs/Guide/web-ifc/Introduction'
                        );
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
