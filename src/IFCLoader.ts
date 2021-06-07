import { IFCManager } from './IFC/IFCManager';
import { BufferGeometry, FileLoader, Intersection, Loader, Mesh, Scene } from 'three';
import { Display } from './IFC/BaseDefinitions';

class IFCLoader extends Loader {
    private ifcManager;

    constructor(manager: any) {
        super(manager);
        this.ifcManager = new IFCManager();
    }

    load(url: any, onLoad: any, onProgress: any, onError: any) {
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

    parse(buffer: any) {
        return this.ifcManager.parse(buffer);
    }

    setWasmPath(path: string) {
        this.ifcManager.setWasmPath(path);
    }

    getExpressId(faceIndex: number) {
        return this.ifcManager.getExpressId(faceIndex);
    }

    pickItem(items: Intersection[], geometry: BufferGeometry, transparent = true) {
        return this.ifcManager.pickItem(items, geometry, transparent);
    }

    setItemsVisibility(ids: number[], mesh: Mesh, state: Display, scene: Scene) {
        this.ifcManager.setItemsDisplay(ids, mesh, state, scene);
    }

    getItemProperties(id: number, all = false, recursive = false) {
        return this.ifcManager.getItemProperties(id, all, recursive);
    }

    getSpatialStructure() {
        return this.ifcManager.getSpatialStructure();
    }
}

export { IFCLoader };
