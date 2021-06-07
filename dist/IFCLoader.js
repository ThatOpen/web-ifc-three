import { IFCRELDEFINESBYPROPERTIES, IFCRELDEFINESBYTYPE, IFCPROJECT, IFCRELAGGREGATES, IFCRELCONTAINEDINSPATIALSTRUCTURE, IfcAPI } from 'web-ifc';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { Mesh, Matrix4, BufferGeometry, BufferAttribute, Color, MeshLambertMaterial, DoubleSide, Loader, FileLoader } from 'three';

const VertexProps = {
  r: "red",
  g: "green",
  b: "blue",
  a: "alfa",
  h: "highlighted"
};

function OpaqueShader(shader) {
  shader.vertexShader = getVertexShader(shader);
  shader.fragmentShader = getFragmentShader(shader, opaque);
}

function TransparentShader(shader) {
  shader.vertexShader = getVertexShader(shader);
  shader.fragmentShader = getFragmentShader(shader, transparent);
}
const opaque = {
  before: `vec4 diffuseColor = vec4( diffuse, opacity );`,
  after: `vec4 diffuseColor = vec4( diffuse, opacity );
  if(vh > 0.){
    if (va <= 0.99) discard;
    else diffuseColor = vec4( vr, vg, vb, opacity );
  }`
};
const transparent = {
  before: `	vec4 diffuseColor = vec4( diffuse, opacity );`,
  after: `vec4 diffuseColor = vec4( diffuse, opacity );
            if(vh > 0.0){
            if (va == 0.0) discard;
            diffuseColor = vec4( vr, vg, vb, va );
            } else discard;`
};

function getFragmentShader(shader, config) {
  return `
  varying float vr;
  varying float vg;
  varying float vb;
  varying float va;
  varying float vh;
${shader.fragmentShader}`.replace(config.before, config.after);
}

function getVertexShader(shader) {
  return `
  attribute float sizes;
  attribute float ${VertexProps.r};
  attribute float ${VertexProps.g};
  attribute float ${VertexProps.b};
  attribute float ${VertexProps.a};
  attribute float ${VertexProps.h};
  varying float vr;
  varying float vg;
  varying float vb;
  varying float va;
  varying float vh;
${shader.vertexShader}`.replace(`#include <fog_vertex>`, `#include <fog_vertex>
    vr = ${VertexProps.r};
    vg = ${VertexProps.g};
    vb = ${VertexProps.b};
    va = ${VertexProps.a};
    vh = ${VertexProps.h};`);
}

class IFCParser {

  constructor(ifcAPI, mapFaceindexID, mapIDFaceindex) {
    this.modelID = -1;
    this.mapFaceindexID = mapFaceindexID;
    this.mapIDFaceindex = mapIDFaceindex;
    this.geometryByMaterials = {};
    this.ifcAPI = ifcAPI;
  }

  async parse(buffer) {
    if (this.ifcAPI.wasmModule === undefined) {
      await this.ifcAPI.Init();
    }
    const data = new Uint8Array(buffer);
    this.modelID = this.ifcAPI.OpenModel(data);
    return this.loadAllGeometry();
  }

  loadAllGeometry() {
    this.saveAllPlacedGeometriesByMaterial();
    return this.generateAllGeometriesByMaterial();
  }

  generateAllGeometriesByMaterial() {
    const {materials, geometries} = this.getMaterialsAndGeometries();
    const allGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
    this.storeFaceindicesByExpressIDs();
    return new Mesh(allGeometry, materials);
  }

  storeFaceindicesByExpressIDs() {
    let previous = 0;
    for (let index in this.mapFaceindexID) {
      const current = parseInt(index);
      const id = this.mapFaceindexID[current];
      var faceIndices = [];
      for (let j = previous; j < current; j++) {
        faceIndices.push(j);
      }
      previous = current;
      if (!this.mapIDFaceindex[id])
        this.mapIDFaceindex[id] = [];
      this.mapIDFaceindex[id].push(...faceIndices);
    }
  }

  getMaterialsAndGeometries() {
    const materials = [];
    const geometries = [];
    let totalFaceCount = 0;
    for (let i in this.geometryByMaterials) {
      materials.push(this.geometryByMaterials[i].material);
      const currentGeometries = this.geometryByMaterials[i].geometry;
      geometries.push(BufferGeometryUtils.mergeBufferGeometries(currentGeometries));
      for (let j in this.geometryByMaterials[i].indices) {
        const globalIndex = parseInt(j, 10) + totalFaceCount;
        this.mapFaceindexID[globalIndex] = this.geometryByMaterials[i].indices[j];
      }
      totalFaceCount += this.geometryByMaterials[i].lastIndex;
    }
    return {
      materials,
      geometries
    };
  }

  saveAllPlacedGeometriesByMaterial() {
    const flatMeshes = this.ifcAPI.LoadAllGeometry(this.modelID);
    for (let i = 0; i < flatMeshes.size(); i++) {
      const flatMesh = flatMeshes.get(i);
      const productId = flatMesh.expressID;
      const placedGeometries = flatMesh.geometries;
      for (let j = 0; j < placedGeometries.size(); j++) {
        this.savePlacedGeometryByMaterial(placedGeometries.get(j), productId);
      }
    }
  }

  savePlacedGeometryByMaterial(placedGeometry, productId) {
    const geometry = this.getBufferGeometry(placedGeometry);
    geometry.computeVertexNormals();
    const matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
    geometry.applyMatrix4(matrix);
    this.saveGeometryByMaterial(geometry, placedGeometry, productId);
  }

  getBufferGeometry(placedGeometry) {
    const geometry = this.ifcAPI.GetGeometry(this.modelID, placedGeometry.geometryExpressID);
    const verts = this.ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
    const indices = this.ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
    return this.ifcGeometryToBuffer(verts, indices);
  }

  getMeshMatrix(matrix) {
    const mat = new Matrix4();
    mat.fromArray(matrix);
    return mat;
  }

  ifcGeometryToBuffer(vertexData, indexData) {
    const geometry = new BufferGeometry();
    const {vertices, normals} = this.extractVertexData(vertexData);
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    geometry.setIndex(new BufferAttribute(indexData, 1));
    return geometry;
  }

  extractVertexData(vertexData) {
    const vertices = [];
    const normals = [];
    let isNormalData = false;
    for (let i = 0; i < vertexData.length; i++) {
      isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i]);
      if ((i + 1) % 3 == 0)
        isNormalData = !isNormalData;
    }
    return {
      vertices,
      normals
    };
  }

  saveGeometryByMaterial(geometry, placedGeometry, productId) {
    if (!geometry.index)
      return;
    const color = placedGeometry.color;
    const colorID = `${color.x}${color.y}${color.z}${color.w}`;
    this.createMaterial(colorID, color);
    const currentGeometry = this.geometryByMaterials[colorID];
    currentGeometry.geometry.push(geometry);
    currentGeometry.lastIndex += geometry.index.count / 3;
    currentGeometry.indices[currentGeometry.lastIndex] = productId;
  }

  createMaterial(colorID, color) {
    if (!this.geometryByMaterials[colorID]) {
      const col = new Color(color.x, color.y, color.z);
      const newMaterial = new MeshLambertMaterial({
        color: col,
        side: DoubleSide
      });
      newMaterial.onBeforeCompile = OpaqueShader;
      newMaterial.transparent = color.w !== 1;
      if (newMaterial.transparent)
        newMaterial.opacity = color.w;
      this.geometryByMaterials[colorID] = this.newGeometryByMaterial(newMaterial);
    }
  }

  newGeometryByMaterial(newMaterial) {
    return {
      material: newMaterial,
      geometry: [],
      indices: {},
      lastIndex: 0
    };
  }

}

class DisplayManager {

  constructor(mapIDFaceindex) {
    this.mapIDFaceindex = mapIDFaceindex;
  }

  setItemsDisplay(ids, mesh, state, scene) {
    const geometry = mesh.geometry;
    this.setupVisibility(geometry);
    const faceIndicesArray = ids.map((id) => this.mapIDFaceindex[id]);
    const faceIndices = [].concat(...faceIndicesArray);
    faceIndices.forEach((faceIndex) => this.setFaceDisplay(geometry, faceIndex, state));
    geometry.attributes[VertexProps.r].needsUpdate = true;
    geometry.attributes[VertexProps.g].needsUpdate = true;
    geometry.attributes[VertexProps.b].needsUpdate = true;
    geometry.attributes[VertexProps.a].needsUpdate = true;
    geometry.attributes[VertexProps.h].needsUpdate = true;
    if (state.a != 1)
      this.setupTransparency(mesh, scene);
  }

  setFaceDisplay(geometry, index, state) {
    if (!geometry.index)
      return;
    const geoIndex = geometry.index.array;
    this.setFaceAttribute(geometry, VertexProps.r, state.r, index, geoIndex);
    this.setFaceAttribute(geometry, VertexProps.g, state.g, index, geoIndex);
    this.setFaceAttribute(geometry, VertexProps.b, state.b, index, geoIndex);
    this.setFaceAttribute(geometry, VertexProps.a, state.a, index, geoIndex);
    this.setFaceAttribute(geometry, VertexProps.h, state.h, index, geoIndex);
  }

  setFaceAttribute(geometry, attr, state, index, geoIndex) {
    geometry.attributes[attr].setX(geoIndex[3 * index], state);
    geometry.attributes[attr].setX(geoIndex[3 * index + 1], state);
    geometry.attributes[attr].setX(geoIndex[3 * index + 2], state);
  }

  setupVisibility(geometry) {
    if (!geometry.attributes[VertexProps.r]) {
      const zeros = new Float32Array(geometry.getAttribute('position').count);
      geometry.setAttribute(VertexProps.r, new BufferAttribute(zeros.slice(), 1));
      geometry.setAttribute(VertexProps.g, new BufferAttribute(zeros.slice(), 1));
      geometry.setAttribute(VertexProps.b, new BufferAttribute(zeros.slice(), 1));
      geometry.setAttribute(VertexProps.a, new BufferAttribute(zeros.slice().fill(1), 1));
      geometry.setAttribute(VertexProps.h, new BufferAttribute(zeros, 1));
    }
  }

  setupTransparency(mesh, scene) {
    if (mesh.transparentMesh)
      return;
    const transMesh = mesh.clone();
    const transparentMaterials = [];
    if (Array.isArray(transMesh.material)) {
      transMesh.material.forEach((mat) => {
        transparentMaterials.push(this.newTransparent(mat));
      });
      transMesh.material = transparentMaterials;
    } else {
      transMesh.material = this.newTransparent(transMesh.material);
    }
    scene.add(transMesh);
    mesh.transparentMesh = transMesh;
  }

  newTransparent(mat) {
    const newMat = mat.clone();
    newMat.transparent = true;
    newMat.onBeforeCompile = TransparentShader;
    return newMat;
  }

}

class ItemPicker {

  constructor(displayManager) {
    this.display = displayManager;
  }

  pickItem(items, geometry, pickTransparent = true) {
    if (!geometry.index)
      return;
    this.display.setupVisibility(geometry);
    for (let i = 0; i < items.length; i++) {
      const index = items[i].faceIndex;
      if (!index)
        continue;
      const trueIndex = geometry.index.array[index * 3];
      const visible = geometry.getAttribute(VertexProps.a).array[trueIndex];
      if (pickTransparent && visible != 0)
        return items[i];
      else if (visible == 1)
        return items[i];
    }
    return null;
  }

}

class PropertyManager {

  constructor(modelID, ifcAPI, mapFaceindexID, mapIDFaceindex) {
    this.modelID = modelID;
    this.mapFaceindexID = mapFaceindexID;
    this.mapIDFaceindex = mapIDFaceindex;
    this.ifcAPI = ifcAPI;
  }

  getExpressId(faceIndex) {
    for (let index in this.mapFaceindexID) {
      if (parseInt(index) > faceIndex)
        return this.mapFaceindexID[index];
    }
    return -1;
  }

  getItemProperties(elementID, all = false, recursive = false) {
    const properties = this.ifcAPI.GetLine(this.modelID, elementID, recursive);
    if (all) {
      const propSetIds = this.getAllRelatedItemsOfType(elementID, IFCRELDEFINESBYPROPERTIES, 'RelatedObjects', 'RelatingPropertyDefinition');
      properties.hasPropertySets = propSetIds.map((id) => this.ifcAPI.GetLine(this.modelID, id, recursive));
      const typeId = this.getAllRelatedItemsOfType(elementID, IFCRELDEFINESBYTYPE, 'RelatedObjects', 'RelatingType');
      properties.hasType = typeId.map((id) => this.ifcAPI.GetLine(this.modelID, id, recursive));
    }
    return properties;
  }

  getSpatialStructure() {
    let lines = this.ifcAPI.GetLineIDsWithType(this.modelID, IFCPROJECT);
    let ifcProjectId = lines.get(0);
    let ifcProject = this.ifcAPI.GetLine(this.modelID, ifcProjectId);
    this.getAllSpatialChildren(ifcProject);
    return ifcProject;
  }

  getAllSpatialChildren(spatialElement) {
    const id = spatialElement.expressID;
    const spatialChildrenID = this.getAllRelatedItemsOfType(id, IFCRELAGGREGATES, 'RelatingObject', 'RelatedObjects');
    spatialElement.hasSpatialChildren = spatialChildrenID.map((id) => this.ifcAPI.GetLine(this.modelID, id, false));
    spatialElement.hasChildren = this.getAllRelatedItemsOfType(id, IFCRELCONTAINEDINSPATIALSTRUCTURE, 'RelatingStructure', 'RelatedElements');
    spatialElement.hasSpatialChildren.forEach((child) => this.getAllSpatialChildren(child));
  }

  getAllRelatedItemsOfType(elementID, type, relation, relatedProperty) {
    const lines = this.ifcAPI.GetLineIDsWithType(this.modelID, type);
    const IDs = [];
    for (let i = 0; i < lines.size(); i++) {
      const relID = lines.get(i);
      const rel = this.ifcAPI.GetLine(this.modelID, relID);
      const relatedItems = rel[relation];
      let foundElement = false;
      if (Array.isArray(relatedItems)) {
        const values = relatedItems.map((item) => item.value);
        foundElement = values.includes(elementID);
      }
      else
        foundElement = relatedItems.value === elementID;
      if (foundElement) {
        const element = rel[relatedProperty];
        if (!Array.isArray(element))
          IDs.push(element.value);
        else
          element.forEach((ele) => IDs.push(ele.value));
      }
    }
    return IDs;
  }

}

class IFCManager {

  constructor() {
    this.modelID = 0;
    this.ifcAPI = new IfcAPI();
    this.mapFaceindexID = {};
    this.mapIDFaceindex = {};
    this.parser = new IFCParser(this.ifcAPI, this.mapFaceindexID, this.mapIDFaceindex);
    this.display = new DisplayManager(this.mapIDFaceindex);
    this.properties = new PropertyManager(this.modelID, this.ifcAPI, this.mapFaceindexID, this.mapIDFaceindex);
    this.picker = new ItemPicker(this.display);
  }

  parse(buffer) {
    return this.parser.parse(buffer);
  }

  setWasmPath(path) {
    this.ifcAPI.SetWasmPath(path);
  }

  pickItem(items, geometry, pickTransparent = true) {
    return this.picker.pickItem(items, geometry, pickTransparent);
  }

  setItemsDisplay(items, mesh, state, scene) {
    this.display.setItemsDisplay(items, mesh, state, scene);
  }

  getExpressId(faceIndex) {
    return this.properties.getExpressId(faceIndex);
  }

  getItemProperties(id, all = false, recursive = false) {
    return this.properties.getItemProperties(id, all, recursive);
  }

  getSpatialStructure() {
    return this.properties.getSpatialStructure();
  }

}

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
    loader.load(url, async function (buffer) {
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
    }, onProgress, onError);
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

  pickItem(items, geometry, transparent = true) {
    return this.ifcManager.pickItem(items, geometry, transparent);
  }

  setItemsVisibility(ids, mesh, state, scene) {
    this.ifcManager.setItemsDisplay(ids, mesh, state, scene);
  }

  getItemProperties(id, all = false, recursive = false) {
    return this.ifcManager.getItemProperties(id, all, recursive);
  }

  getSpatialStructure() {
    return this.ifcManager.getSpatialStructure();
  }

}

export { IFCLoader };
//# sourceMappingURL=IFCLoader.js.map
