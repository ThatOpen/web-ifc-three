import { IFCLoader } from '../dist/IFCLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from '../node_modules/stats.js/src/Stats';
import {
    Scene,
    Color,
    WebGLRenderer,
    PerspectiveCamera,
    Mesh,
    DirectionalLight,
    AmbientLight,
    Raycaster,
    Vector2,
    BufferGeometry,
    MeshLambertMaterial
} from 'three';
import { IFCCURTAINWALL, IFCDOOR, IFCFURNISHINGELEMENT, IFCPLATE, IFCWINDOW } from 'web-ifc';

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
const ifcMeshes = [];
(function readIfcFile() {
    const input = document.querySelector('input[type="file"]');
    if (!input) return;
    input.addEventListener(
        'change',
        (changed) => {
            var ifcURL = URL.createObjectURL(changed.target.files[0]);
            ifcLoader.load(ifcURL, (mesh) => {
                mesh.material = new MeshLambertMaterial({transparent: true, opacity: 0.2})
                ifcMeshes.push(mesh);
                scene.add(mesh);
            });
        },
        false
    );
})();

//Setup object picking
let previousSelection;

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;

function selectObject(event) {

    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersected = raycaster.intersectObjects(ifcMeshes);

    if (intersected.length) {

        const item = intersected[0];
        if(previousSelection == item.faceIndex) return;
        previousSelection = item.faceIndex;

        const modelID = item.object.modelID;

        const id = ifcLoader.getExpressId(modelID, item.faceIndex);

        ifcLoader.highlight(modelID, [id], scene, { removePrevious: true });

        
    }
}

function getProps(){
    const furnitures = ifcLoader.getAllItemsOfType(0, IFCFURNISHINGELEMENT);
    const windows = ifcLoader.getAllItemsOfType(0, IFCWINDOW);
    const doors = ifcLoader.getAllItemsOfType(0, IFCDOOR);
    const cwalls = ifcLoader.getAllItemsOfType(0, IFCPLATE);

    const allItems = [...furnitures, ...windows, ...doors, ...cwalls ];
    ifcLoader.highlight(0, allItems, scene);

}

threeCanvas.ondblclick = getProps;
// threeCanvas.onmousemove = selectObject;
