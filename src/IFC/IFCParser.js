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

export class IFCParser {

    constructor(ifcAPI, mapFaceindexID, mapIDFaceindex){
        this.mapFaceindexID = mapFaceindexID;
        this.mapIDFaceindex = mapIDFaceindex;
        this.ifcAPI = ifcAPI;
    }

    async parse( buffer ) {

		const geometryByMaterials = {};
		const mapFaceindexID = this.mapFaceindexID;
		const mapIDFaceindex = this.mapIDFaceindex;
        const ifcAPI = this.ifcAPI;

		if ( this.ifcAPI.wasmModule === undefined ) {

			await this.ifcAPI.Init();

		}

		const data = new Uint8Array( buffer );
		this.modelID = this.ifcAPI.OpenModel( 'example.ifc', data );
		return loadAllGeometry( this.modelID );

		function loadAllGeometry(modelID) {

			saveAllPlacedGeometriesByMaterial(modelID);
			return generateAllGeometriesByMaterial();

		}
	
		function generateAllGeometriesByMaterial() {

			const { materials, geometries } = getMaterialsAndGeometries();
			const allGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
			storeFaceindicesByExpressIDs();
			return new Mesh(allGeometry, materials);

		}

		function storeFaceindicesByExpressIDs(){

			let previous = 0;

			for(let index in mapFaceindexID){

				const current = parseInt(index);
				const id = mapFaceindexID[current];

				var faceIndices = [];
				for (let j = previous; j < current; j++) {
					faceIndices.push(j);
				}

				previous = current;

				if(!mapIDFaceindex[id]) mapIDFaceindex[id] = [];
				mapIDFaceindex[id].push(...faceIndices);

			}
		}
	
		function getMaterialsAndGeometries() {

			const materials = [];
			const geometries = [];
			let totalFaceCount = 0;

			for (let i in geometryByMaterials) {

				materials.push(geometryByMaterials[i].material);
				const currentGeometries = geometryByMaterials[i].geometry;
				geometries.push(BufferGeometryUtils.mergeBufferGeometries(currentGeometries));

				for (let j in geometryByMaterials[i].indices) {

					const globalIndex = parseInt(j, 10) + parseInt(totalFaceCount, 10);
					mapFaceindexID[globalIndex] = geometryByMaterials[i].indices[j];

				}

				totalFaceCount += geometryByMaterials[i].lastIndex;

			}

			return { materials, geometries };

		}
	
		function saveAllPlacedGeometriesByMaterial(modelID) {

			const flatMeshes = ifcAPI.LoadAllGeometry(modelID);

			for (let i = 0; i < flatMeshes.size(); i++) {

				const flatMesh = flatMeshes.get(i);
				const productId = flatMesh.expressID;
				const placedGeometries = flatMesh.geometries;

				for (let j = 0; j < placedGeometries.size(); j++) {

					savePlacedGeometryByMaterial(modelID, placedGeometries.get(j), productId);

				}
			}
		}

		function savePlacedGeometryByMaterial(modelID, placedGeometry, productId) {

			const geometry = getBufferGeometry(modelID, placedGeometry);
			geometry.computeVertexNormals();
			const matrix = getMeshMatrix(placedGeometry.flatTransformation);
			geometry.applyMatrix4(matrix);
			saveGeometryByMaterial(geometry, placedGeometry, productId);

		}

		function getBufferGeometry(modelID, placedGeometry) {

			const geometry = ifcAPI.GetGeometry(modelID, placedGeometry.geometryExpressID);
			const verts = ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
			const indices = ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
			return ifcGeometryToBuffer(verts, indices);

		}

		function getMeshMatrix(matrix) {

			const mat = new Matrix4();
			mat.fromArray(matrix);
			return mat;

		}
	
		function ifcGeometryToBuffer(vertexData, indexData) {

			const geometry = new BufferGeometry();
			const { vertices, normals } = extractVertexData(vertexData);
			geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
			geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
			geometry.setIndex(new BufferAttribute(indexData, 1));
			return geometry;

		}
	
		function extractVertexData(vertexData) {

			const vertices = [];
			const normals = [];
			let isNormalData = false;

			for (let i = 0; i < vertexData.length; i++) {

				isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i]);
				if ((i + 1) % 3 == 0) isNormalData = !isNormalData;

			}

			return { vertices, normals };

		}
	
		function saveGeometryByMaterial(geometry, placedGeometry, productId) {

			const color = placedGeometry.color;
			const id = `${color.x}${color.y}${color.z}${color.w}`;
			createMaterial(id, color);
			const currentGeometry = geometryByMaterials[id];
			currentGeometry.geometry.push(geometry);
			currentGeometry.lastIndex += geometry.index.count / 3;
			currentGeometry.indices[currentGeometry.lastIndex] = productId;

		}
	
		function createMaterial(id, color) {

			if (!geometryByMaterials[id]){

				const col = new Color(color.x, color.y, color.z);
				const newMaterial = new MeshLambertMaterial({ color: col, side: DoubleSide });
				newMaterial.onBeforeCompile = materialCustomDisplay;
				newMaterial.transparent = color.w !== 1;
				if (newMaterial.transparent) newMaterial.opacity = color.w;
				geometryByMaterials[id] = initializeGeometryByMaterial(newMaterial);

			}
		}
	
		function initializeGeometryByMaterial(newMaterial) {

			return {
				material: newMaterial,
				geometry: [],
				indices: {},
				lastIndex: 0

			};
	  	}

		function materialCustomDisplay(shader) {
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
			  if(vh > 0.){
				if (va <= 0.99) discard;
				else diffuseColor = vec4( vr, vg, vb, opacity );
			  } 
			  `
			);
		}
	}

}