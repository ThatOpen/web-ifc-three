import { IfcLoader } from '../src/IfcLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from "../node_modules/stats.js/src/Stats"
import {
  Scene,
  Color,
  WebGLRenderer,
  PerspectiveCamera,
  BoxGeometry,
  MeshPhongMaterial,
  Mesh,
  DirectionalLight,
  AmbientLight
} from 'three';

//Scene
const scene = new Scene();
scene.background = new Color(0x8cc7de);

//Renderer
const threeCanvas = document.getElementById("threeCanvas");
const renderer = new WebGLRenderer({ antialias: true, canvas: threeCanvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Camera
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
let controls = new OrbitControls(camera, renderer.domElement);

//Initial cube
const geometry = new BoxGeometry();
const material = new MeshPhongMaterial({ color: 0xffffff });
const cube = new Mesh(geometry, material);
scene.add(cube);

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
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})

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

AnimationLoop();

//Setup IFC Loader
(function readIfcFile() {
  const input = document.querySelector('input[type="file"]');
  if (!input) return;
  input.addEventListener(
    'change',
    (changed) => {
      var ifcURL = URL.createObjectURL(changed.target.files[0]);
      const ifcLoader = new IfcLoader();
      ifcLoader.load(ifcURL, (geometry) =>{
        scene.add(geometry);
        // console.log(ifcLoader.getObjectGUID(geometry, 14, 175425));
        console.log(renderer.info)
      })
    },
    false
  );
})();

