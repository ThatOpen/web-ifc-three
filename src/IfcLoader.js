import { IfcAPI } from 'web-ifc/web-ifc-api';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import {
  FileLoader,
  Loader,
  Mesh,
  Color,
  MeshPhongMaterial,
  DoubleSide,
  Matrix4,
  BufferGeometry,
  BufferAttribute
} from 'three/build/three.module';

var IfcLoader = function (manager) {
  Loader.call(this, manager);
};

var ifcAPI = new IfcAPI();
ifcAPI.Init();

var modelID;

var materials = {};

IfcLoader.prototype = Object.assign(Object.create(Loader.prototype), {
  constructor: IfcLoader,

  load: function (url, onLoad, onProgress, onError) {
    var scope = this;

    var loader = new FileLoader(scope.manager);
    loader.setPath(scope.path);
    loader.setResponseType('arraybuffer');
    loader.setRequestHeader(scope.requestHeader);
    loader.setWithCredentials(scope.withCredentials);
    loader.load(
      url,
      function (buffer) {
        try {
          onLoad(scope.parse(buffer));
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
  },

  getIfcItemInformation: function (expressID) {
    return ifcAPI.GetLine(modelID, expressID);
  },

  setWasmPath(path) {
    ifcAPI.SetWasmPath(path);
  },

  parse: (function () {
    return function (buffer) {
      var data = new Uint8Array(buffer);
      modelID = ifcAPI.OpenModel('example.ifc', data);
      return loadAllGeometry(modelID);

      function loadAllGeometry(modelID) {
        var flatMeshes = getFlatMeshes(modelID);
        var geometries = [], allMaterials = [];
        for (var i = 0; i < flatMeshes.size(); i++) {
          var placedGeometries = flatMeshes.get(i).geometries;
          for (var j = 0; j < placedGeometries.size(); j++) {
            var { geometry, material } = getPlacedGeometry(modelID, placedGeometries.get(j));
            geometries.push(geometry);
            allMaterials.push(material);
          }
        }
        var merged = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
        var mesh = new Mesh(merged, allMaterials);
        console.log(allMaterials);
        return mesh;
      }

      function getFlatMeshes(modelID) {
        var flatMeshes = ifcAPI.LoadAllGeometry(modelID);
        return flatMeshes;
      }

      function getPlacedGeometry(modelID, placedGeometry) {
        var geometry = getBufferGeometry(modelID, placedGeometry);
        geometry.computeVertexNormals();
        var material = getMaterial(placedGeometry.color);
        var matrix = getMeshMatrix(placedGeometry.flatTransformation);
        geometry.applyMatrix4(matrix);
        return { geometry, material };
      }

      function getBufferGeometry(modelID, placedGeometry) {
        var geometry = ifcAPI.GetGeometry(modelID, placedGeometry.geometryExpressID);
        var verts = ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
        var indices = ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
        var bufferGeometry = ifcGeometryToBuffer(verts, indices);
        return bufferGeometry;
      }

      function getMeshMatrix(matrix) {
        var mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
      }

      function ifcGeometryToBuffer(vertexData, indexData) {
        var geometry = new BufferGeometry();

        var { vertices, normals } = spliceVertexData(vertexData, false);
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
        geometry.setIndex(new BufferAttribute(indexData, 1));

        return geometry;
      }

      function spliceVertexData(vertexData) {
        var vertices = [],
          normals = [];
        var isNormalData = false;
        for (var i = 0; i < vertexData.length; i++) {
          isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i]);
          if ((i + 1) % 3 == 0) isNormalData = !isNormalData;
        }
        return { vertices, normals };
      }

      function getMaterial(color) {
        var id = `${color.x}${color.y}${color.z}${color.w}`;
        if (!materials[id]) {
          var col = new Color(color.x, color.y, color.z);
          var newMaterial = new MeshPhongMaterial({ color: col, side: DoubleSide });
          newMaterial.transparent = color.w !== 1;
          if (newMaterial.transparent) newMaterial.opacity = color.w;
          materials[id] = newMaterial;
        }
        return materials[id];
      }
    };
    materials = {};
  })()
});

export { IfcLoader };
