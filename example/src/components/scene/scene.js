import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer, GridHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js/src/Stats';

export class ThreeScene {
    constructor() {
        this.threeCanvas = document.getElementById('threeCanvas');
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({ antialias: true, canvas: this.threeCanvas });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.stats = new Stats();
        this.grid = new GridHelper();
        this.setupScene();
    }

    setupScene() {
        this.setupBasics();
        this.setupLights();
        this.setupWindowResize();
        this.setupMonitoring();
        this.setupAnimation();
        this.setupCamera();
        this.scene.add(this.grid);
    }

    setupAnimation = () => {
        this.stats.begin();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.stats.end();
        requestAnimationFrame(this.setupAnimation);
    }

    setupBasics() {
        this.scene.background = new Color(0x8cc7de);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.position.z = 5;
    }

    setupLights() {
        const directionalLight1 = new DirectionalLight(0xffeeff, 0.8);
        directionalLight1.position.set(1, 1, 1);
        this.scene.add(directionalLight1);
        const directionalLight2 = new DirectionalLight(0xffffff, 0.8);
        directionalLight2.position.set(-1, 0.5, -1);
        this.scene.add(directionalLight2);
        const ambientLight = new AmbientLight(0xffffee, 0.25);
        this.scene.add(ambientLight);
    }

    setupWindowResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupMonitoring() {
        this.stats.showPanel(0);
        this.stats.dom.style.cssText = 'position:absolute;top:1rem;left:1rem;z-index:1;';
        document.body.appendChild(this.stats.dom);
    }

    setupCamera() {
        this.camera.position.set(10, 10, 10);
        this.controls.target.set(0, 0, 0);
    }
}