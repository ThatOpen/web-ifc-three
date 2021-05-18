import {
	BufferGeometry,
	Loader,
	LoadingManager,
	Scene
} from 'three';

export class IfcLoader extends Loader {

	constructor( manager?: LoadingManager );

	setWasmPath(path: string): void;
	getExpressId(faceIndex: number): number;
	selectItem(faceIndex: number, scene: Scene): number;
	load( url: string, onLoad: ( geometry: BufferGeometry ) => void, onProgress?: ( event: ProgressEvent ) => void, onError?: ( event: ErrorEvent ) => void ): void;
	parse( data: ArrayBuffer ): BufferGeometry;
	getIfcItemInformation(expressID: number): object;
}