import * as WebIFC from 'web-ifc/web-ifc-api';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import {
  FileLoader,
  Loader,
  Mesh,
  Color,
  MeshBasicMaterial,
  MeshLambertMaterial,
  DoubleSide,
  Matrix4,
  BufferGeometry,
  BufferAttribute
} from 'three/build/three.module';
import { IFCParser } from './IFC/IFCParser';

const display = {
	r: "r",
	g: "g",
	b: "b",
	a: "a",
	highlighted: "h"
}

class IFCLoader extends Loader {

	constructor( manager ) {
		super( manager );
		this.modelID = 0;
		this.ifcAPI = new WebIFC.IfcAPI();
		this.mapFaceindexID = {};
		this.mapIDFaceindex = {};
		this.mapIDGeometry = {};
		this.selectedObjects = [];
		this.highlightMaterial = new MeshBasicMaterial({ color: 0xff0000, depthTest: false, side: DoubleSide });
		this.parser = new IFCParser(this.ifcAPI, this.mapFaceindexID, this.mapIDFaceindex);
	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		const loader = new FileLoader( scope.manager );
		loader.setPath( scope.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( scope.requestHeader );
		loader.setWithCredentials( scope.withCredentials );
		loader.load(
			url,
			async function ( buffer ) {

				try {

					onLoad( await scope.parse( buffer ) );

				} catch ( e ) {

					if ( onError ) {

						onError( e );

					} else {

						console.error( e );

					}

					scope.manager.itemError( url );

				}

			},
			onProgress,
			onError
		);

	}

	parse(buffer){
		return this.parser.parse(buffer);
	}

	setWasmPath( path ) {

		this.ifcAPI.SetWasmPath( path );

	}

	getExpressId( faceIndex ) {

		for (let index in this.mapFaceindexID) {

		  if (parseInt(index) > faceIndex) return this.mapFaceindexID[index];

		}

		return -1;
	}

	pickItem( items, geometry, pickTransparent = true ){

		this.setupVisibility(geometry);

		for (let i = 0; i < items.length; i++) {

			const index = items[i].faceIndex;
			const trueIndex = geometry.index.array[index * 3];
			const visible = geometry.getAttribute(display.a).array[trueIndex];
			if(pickTransparent && visible != 0) return items[i];
			else if(visible == 1) return items[i];
			
		}

		return null;

	}

	setItemsVisibility( expressIds, mesh, state, scene ) {

		const geometry = mesh.geometry;
		this.setupVisibility(geometry);

		const faceIndicesArray = expressIds.map(id => this.mapIDFaceindex[id]);
		var faceIndices = [].concat.apply([], faceIndicesArray);
		faceIndices.forEach(faceIndex => this.setFaceDisplay(geometry, faceIndex, state));

		geometry.attributes[display.r].needsUpdate = true;
		geometry.attributes[display.g].needsUpdate = true;
		geometry.attributes[display.b].needsUpdate = true;
		geometry.attributes[display.a].needsUpdate = true;
		geometry.attributes[display.highlighted].needsUpdate = true;

		if(state.a != 1) this.updateTransparency(mesh, scene, state);

	}

	setFaceDisplay( geometry, index, state ) {

		const geoIndex = geometry.index.array;
		this.setFaceAttribute(geometry, display.r, state.r, index, geoIndex);
		this.setFaceAttribute(geometry, display.g, state.g, index, geoIndex);
		this.setFaceAttribute(geometry, display.b, state.b, index, geoIndex);
		this.setFaceAttribute(geometry, display.a, state.a, index, geoIndex);
		this.setFaceAttribute(geometry, display.highlighted, state.h, index, geoIndex);
		
	}

	setFaceAttribute( geometry, attribute, state, index, geoIndex ){

		geometry.attributes[attribute].setX(geoIndex[3 * index], state);
		geometry.attributes[attribute].setX(geoIndex[3 * index + 1], state);
		geometry.attributes[attribute].setX(geoIndex[3 * index + 2], state);

	}

	setupVisibility( geometry ) {

		if (!geometry.attributes[display.r]) {

		  const zeros = new Float32Array(geometry.getAttribute('position').count);
		  geometry.setAttribute(display.r, new BufferAttribute(zeros.slice(), 1));
		  geometry.setAttribute(display.g, new BufferAttribute(zeros.slice(), 1));
		  geometry.setAttribute(display.b, new BufferAttribute(zeros.slice(), 1));
		  geometry.setAttribute(display.a, new BufferAttribute(zeros.slice().fill(1), 1));
		  geometry.setAttribute(display.highlighted, new BufferAttribute(zeros, 1));

		}

	}

	updateTransparency(mesh, scene, state){
		if(!mesh.geometry._transparentMesh) this.setupTransparency(mesh, scene)
	}

	setupTransparency(mesh, scene){
		const transparentMesh = mesh.clone();

		const transparentMaterials = []
		transparentMesh.material.forEach(mat => {
			const newMat = mat.clone();
			newMat.transparent = true;
			// newMat.depthTest = false;
			newMat.onBeforeCompile = materialTransparentDisplay;
			transparentMaterials.push(newMat);
		})
		transparentMesh.material = transparentMaterials;

		scene.add(transparentMesh);
		mesh.geometry._transparentMesh = transparentMesh;

		function materialTransparentDisplay(shader) {
			shader.vertexShader = `
			attribute float sizes;
			attribute float r;
			attribute float g;
			attribute float b;
			attribute float a;
			attribute float h;
			varying float vr;
			varying float vg;
			varying float vb;
			varying float va;
			varying float vh;
		  ${shader.vertexShader}`.replace(
			  `#include <fog_vertex>`,
			  `#include <fog_vertex>
			  vr = r;
			  vg = g;
			  vb = b;
			  va = a;
			  vh = h;
			`
			);
			shader.fragmentShader = `
			varying float vr;
			varying float vg;
			varying float vb;
			varying float va;
			varying float vh;
		  ${shader.fragmentShader}`.replace(
			  `	vec4 diffuseColor = vec4( diffuse, opacity );`,
			  `
			  vec4 diffuseColor = vec4( diffuse, opacity );
			  if(vh > 0.0){
				if (va == 0.0) discard;
				diffuseColor = vec4( vr, vg, vb, va );
			  } else discard;
			  `
			);
		}

	}

	getItemProperties( elementID, all = false, recursive = false ) {

		const properties = this.ifcAPI.GetLine(this.modelID, elementID, recursive);
	
		if (all) {

		  const propSetIds = this.getAllRelatedItemsOfType(elementID, WebIFC.IFCRELDEFINESBYPROPERTIES, "RelatedObjects", "RelatingPropertyDefinition");
		  properties.hasPropertySets = propSetIds.map((id) => this.ifcAPI.GetLine(this.modelID, id, recursive));
	
		  const typeId = this.getAllRelatedItemsOfType(elementID, WebIFC.IFCRELDEFINESBYTYPE, "RelatedObjects", "RelatingType");
		  properties.hasType = typeId.map((id) => this.ifcAPI.GetLine(this.modelID, id, recursive));
		  
		}
	
		// properties.type = properties.constructor.name;
		return properties;

	}

	getSpatialStructure() {

		let lines = this.ifcAPI.GetLineIDsWithType(this.modelID, WebIFC.IFCPROJECT);
		let ifcProjectId = lines.get(0);
		let ifcProject = this.ifcAPI.GetLine(this.modelID, ifcProjectId);
		this.getAllSpatialChildren(ifcProject);
		return ifcProject;

	}
	
	getAllSpatialChildren( spatialElement ) {

		const id = spatialElement.expressID;
		const spatialChildrenID = this.getAllRelatedItemsOfType(id, WebIFC.IFCRELAGGREGATES, "RelatingObject", "RelatedObjects");
		spatialElement.hasSpatialChildren = spatialChildrenID.map((id) => this.ifcAPI.GetLine(this.modelID, id, false));
		spatialElement.hasChildren = this.getAllRelatedItemsOfType(id, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, "RelatingStructure", "RelatedElements");
		spatialElement.hasSpatialChildren.forEach(child => this.getAllSpatialChildren(child));
		
	}
	
	getAllRelatedItemsOfType ( elementID, type, relation, relatedProperty ) {

		const lines = this.ifcAPI.GetLineIDsWithType(this.modelID, type);
		const IDs = [];

		for (let i = 0; i < lines.size(); i++) {

		  	const relID = lines.get(i);
		  	const rel = this.ifcAPI.GetLine(this.modelID, relID);
		  	const relatedItems = rel[relation];
		  	let foundElement = false;
	
		  	if (Array.isArray(relatedItems)){

				const values = relatedItems.map(item => item.value);
 			    foundElement = values.includes(elementID);
			}
			else foundElement = (relatedItems.value === elementID);
	
		  	if (foundElement) {

				const element = rel[relatedProperty];
				if (!Array.isArray(element)) IDs.push(element.value);
				else element.forEach(ele => IDs.push(ele.value))
			
		  	}
		}
		return IDs;
	}
}

export { IFCLoader };
