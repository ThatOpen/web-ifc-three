import { IFCLoader } from '../dist/IFCLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from '../node_modules/stats.js/src/Stats';
import {
  Scene,
  Color,
  WebGLRenderer,
  PerspectiveCamera,
  BoxGeometry,
  MeshPhongMaterial,
  Mesh,
  DirectionalLight,
  AmbientLight,
  Raycaster,
  Vector3,
  Vector2
} from 'three';

//Scene
const scene = new Scene();
scene.background = new Color(0x8cc7de);

//Renderer
const threeCanvas = document.getElementById('threeCanvas');
const renderer = new WebGLRenderer({ antialias: true, canvas: threeCanvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Camera
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
let controls = new OrbitControls(camera, renderer.domElement);

//Initial cube
// const geometry = new BoxGeometry();
// const material = new MeshPhongMaterial({ color: 0xffffff });
// const cube = new Mesh(geometry, material);
// scene.add(cube);

//Lights
const directionalLight1 = new DirectionalLight(0xffeeff, 0.8);
directionalLight1.position.set(1, 1, 1);
scene.add(directionalLight1);
const directionalLight2 = new DirectionalLight(0xffffff, 0.8);
directionalLight2.position.set(-1, 0.5, -1);
scene.add(directionalLight2);
const ambientLight = new AmbientLight(0xffffee, 0.25);
scene.add(ambientLight);

//Window resize support
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//Monitoring
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);


//Animation
function AnimationLoop() {
  stats.begin();
  controls.update();
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(AnimationLoop);
}

const ifcLoader = new IFCLoader();

AnimationLoop();

//Setup IFC Loader
(function readIfcFile() {
  const input = document.querySelector('input[type="file"]');
  if (!input) return;
  input.addEventListener(
    'change',
    (changed) => {
      var ifcURL = URL.createObjectURL(changed.target.files[0]);
      ifcLoader.load(ifcURL, (geometry) => {
        ifcMesh = geometry;
        scene.add(ifcMesh);
      });
    },
    false
  );
})();

//Setup object picking

let ifcMesh = {};
let previousSelection;
const resetDisplayState = { r: 0, g: 0, b: 0, a: 1, h: 0 };

function selectObject(event) {
  if (event.button != 0) return;

  const mouse = new Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersected = raycaster.intersectObjects(scene.children);
  if (intersected.length){

    if(previousSelection) ifcLoader.setItemsDisplay([previousSelection], ifcMesh, resetDisplayState, scene);

    const item = ifcLoader.pickItem(intersected, ifcMesh.geometry);
    const id = ifcLoader.getExpressId(item.faceIndex);
    previousSelection = id;

    const properties = ifcLoader.getItemProperties(id);
    console.log(properties);

    // const ifcProject = ifcLoader.getSpatialStructure();
    // console.log(ifcProject);

    const state = { r: 0, g: 0, b: 1, a: 0.2, h: 1 }
    ifcLoader.setItemsDisplay([id], ifcMesh, state, scene);

  } 
}

threeCanvas.ondblclick = selectObject;
