// import { IfcAPI } from 'web-ifc/web-ifc-api';
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

const ifcAPI = new WebIFC.IfcAPI();
const display = {
  r: 'r',
  g: 'g',
  b: 'b',
  a: 'a',
  highlighted: 'h'
};

class IFCLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.modelID = 0;
    this.mapFaceindexID = {};
    this.mapIDFaceindex = {};
    this.mapIDGeometry = {};
    this.selectedObjects = [];
    this.highlightMaterial = new MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false,
      side: DoubleSide
    });
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

  setWasmPath(path) {
    ifcAPI.SetWasmPath(path);
  }

  getExpressId(faceIndex) {
    for (let index in this.mapFaceindexID) {
      if (parseInt(index) > faceIndex) return this.mapFaceindexID[index];
    }

    return -1;
  }

  pickItem(items, geometry, pickTransparent = true) {
    this.setupVisibility(geometry);

    for (let i = 0; i < items.length; i++) {
      const index = items[i].faceIndex;
      const trueIndex = geometry.index.array[index * 3];
      const visible = geometry.getAttribute(display.a).array[trueIndex];
      if (pickTransparent && visible !== 0) return items[i];
      else if (visible === 1) return items[i];
    }

    return null;
  }

  setItemsVisibility(expressIds, mesh, state, scene) {
    const geometry = mesh.geometry;
    this.setupVisibility(geometry);

    const faceIndicesArray = expressIds.map((id) => this.mapIDFaceindex[id]);
    var faceIndices = [].concat.apply([], faceIndicesArray);
    faceIndices.forEach((faceIndex) => this.setFaceDisplay(geometry, faceIndex, state));

    geometry.attributes[display.r].needsUpdate = true;
    geometry.attributes[display.g].needsUpdate = true;
    geometry.attributes[display.b].needsUpdate = true;
    geometry.attributes[display.a].needsUpdate = true;
    geometry.attributes[display.highlighted].needsUpdate = true;

    if (state.a !== 1) this.updateTransparency(mesh, scene, state);
  }

  setFaceDisplay(geometry, index, state) {
    const geoIndex = geometry.index.array;
    this.setFaceAttribute(geometry, display.r, state.r, index, geoIndex);
    this.setFaceAttribute(geometry, display.g, state.g, index, geoIndex);
    this.setFaceAttribute(geometry, display.b, state.b, index, geoIndex);
    this.setFaceAttribute(geometry, display.a, state.a, index, geoIndex);
    this.setFaceAttribute(geometry, display.highlighted, state.h, index, geoIndex);
  }

  setFaceAttribute(geometry, attribute, state, index, geoIndex) {
    geometry.attributes[attribute].setX(geoIndex[3 * index], state);
    geometry.attributes[attribute].setX(geoIndex[3 * index + 1], state);
    geometry.attributes[attribute].setX(geoIndex[3 * index + 2], state);
  }

  setupVisibility(geometry) {
    if (!geometry.attributes[display.r]) {
      const zeros = new Float32Array(geometry.getAttribute('position').count);
      geometry.setAttribute(display.r, new BufferAttribute(zeros.slice(), 1));
      geometry.setAttribute(display.g, new BufferAttribute(zeros.slice(), 1));
      geometry.setAttribute(display.b, new BufferAttribute(zeros.slice(), 1));
      geometry.setAttribute(display.a, new BufferAttribute(zeros.slice().fill(1), 1));
      geometry.setAttribute(display.highlighted, new BufferAttribute(zeros, 1));
    }
  }

  updateTransparency(mesh, scene, state) {
    if (!mesh.geometry._transparentMesh) this.setupTransparency(mesh, scene);
  }

  setupTransparency(mesh, scene) {
    const transparentMesh = mesh.clone();

    const transparentMaterials = [];
    transparentMesh.material.forEach((mat) => {
      const newMat = mat.clone();
      newMat.transparent = true;
      // newMat.depthTest = false;
      newMat.onBeforeCompile = materialTransparentDisplay;
      transparentMaterials.push(newMat);
    });
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

  getItemProperties(elementID, all = false, recursive = false) {
    const properties = ifcAPI.GetLine(this.modelID, elementID, recursive);

    if (all) {
      const propSetIds = this.getAllRelatedItemsOfType(
        elementID,
        WebIFC.IFCRELDEFINESBYPROPERTIES,
        'RelatedObjects',
        'RelatingPropertyDefinition'
      );
      properties.hasPropertySets = propSetIds.map((id) =>
        ifcAPI.GetLine(this.modelID, id, recursive)
      );

      const typeId = this.getAllRelatedItemsOfType(
        elementID,
        WebIFC.IFCRELDEFINESBYTYPE,
        'RelatedObjects',
        'RelatingType'
      );
      properties.hasType = typeId.map((id) => ifcAPI.GetLine(this.modelID, id, recursive));
    }

    // properties.type = properties.constructor.name;
    return properties;
  }

  getSpatialStructure() {
    let lines = ifcAPI.GetLineIDsWithType(this.modelID, WebIFC.IFCPROJECT);
    let ifcProjectId = lines.get(0);
    let ifcProject = ifcAPI.GetLine(this.modelID, ifcProjectId);
    this.getAllSpatialChildren(ifcProject);
    return ifcProject;
  }

  getAllSpatialChildren(spatialElement) {
    const id = spatialElement.expressID;
    const spatialChildrenID = this.getAllRelatedItemsOfType(
      id,
      WebIFC.IFCRELAGGREGATES,
      'RelatingObject',
      'RelatedObjects'
    );
    spatialElement.hasSpatialChildren = spatialChildrenID.map((id) =>
      ifcAPI.GetLine(this.modelID, id, false)
    );
    spatialElement.hasChildren = this.getAllRelatedItemsOfType(
      id,
      WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
      'RelatingStructure',
      'RelatedElements'
    );
    spatialElement.hasSpatialChildren.forEach((child) => this.getAllSpatialChildren(child));
  }

  getAllRelatedItemsOfType(elementID, type, relation, relatedProperty) {
    const lines = ifcAPI.GetLineIDsWithType(this.modelID, type);
    const IDs = [];

    for (let i = 0; i < lines.size(); i++) {
      const relID = lines.get(i);
      const rel = ifcAPI.GetLine(this.modelID, relID);
      const relatedItems = rel[relation];
      let foundElement = false;

      if (Array.isArray(relatedItems)) {
        const values = relatedItems.map((item) => item.value);
        foundElement = values.includes(elementID);
      } else foundElement = relatedItems.value === elementID;

      if (foundElement) {
        const element = rel[relatedProperty];
        if (!Array.isArray(element)) IDs.push(element.value);
        else element.forEach((ele) => IDs.push(ele.value));
      }
    }
    return IDs;
  }

  async parse(buffer) {
    const geometryByMaterials = {};
    const mapFaceindexID = this.mapFaceindexID;
    const mapIDFaceindex = this.mapIDFaceindex;

    if (ifcAPI.wasmModule === undefined) {
      await ifcAPI.Init();
    }

    const data = new Uint8Array(buffer);
    this.modelID = ifcAPI.OpenModel('example.ifc', data);
    return loadAllGeometry(this.modelID);

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

    function storeFaceindicesByExpressIDs() {
      let previous = 0;

      for (let current in mapFaceindexID) {
        const id = mapFaceindexID[current];

        var faceIndices = [];
        for (let j = previous; j < current; j++) {
          faceIndices.push(j);
        }

        previous = current;

        if (!mapIDFaceindex[id]) mapIDFaceindex[id] = [];
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
        if ((i + 1) % 3 === 0) isNormalData = !isNormalData;
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
      if (!geometryByMaterials[id]) {
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

export { IFCLoader };
