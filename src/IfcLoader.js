import { IFCManager } from './IFC/IFCManager';
import { FileLoader, Loader } from 'three/build/three.module';

class IFCLoader extends Loader {
    constructor(manager) {
        super(manager);
        this.ifcManager = new IFCManager();
    }

    load(url, onLoad, onProgress, onError) {
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

    parse(buffer) {
        return this.ifcManager.parse(buffer);
    }

    setWasmPath(path) {
        this.ifcManager.setWasmPath(path);
    }

    getExpressId(faceIndex) {
        return this.ifcManager.getExpressId(faceIndex);
    }

    pickItem(items, geometry, pickTransparent = true) {
        return this.ifcManager.pickItem(items, geometry, pickTransparent);
    }

    setItemsVisibility(id, mesh, state, scene) {
        this.ifcManager.setItemsDisplay(id, mesh, state, scene);
    }

    getItemProperties(id, all = false, recursive = false) {
        return this.ifcManager.getItemProperties(id, all, recursive);
    }

    getSpatialStructure() {
        return this.ifcManager.getSpatialStructure();
    }
}

export { IFCLoader };
