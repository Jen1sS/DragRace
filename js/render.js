import * as THREE from 'three';
import {Clock} from "three";
//import WebGPURenderer from '../node_modules/three/examples/jsm/renderers/webgpu/WebGPURenderer.js'; CHIEDERE A SAMMA



let gl = null;
let renderer = null;

let scene = null;
let camera = null;
let clock = null;




function initScene(){

    if (renderer != null) return;

    document.body.innerHTML = "";

    let width = window.innerWidth;
    let height = window.innerHeight;


    renderer = new THREE.WebGLRenderer({antialias: "true", powerPreference: "high-performance"});
    renderer.autoClear = false;
    renderer.setSize(width, height);
    renderer.setClearColor("black", 1);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(50, width/height, 0.1, 500);
    camera.position.set(0, 1.80, -5);
    camera.lookAt(0, 1.80, 10);


    renderer.setAnimationLoop(animate);
}

function animate(){
    let dt = clock.getDelta();

    renderer.clear();
    renderer.render(scene, camera);
}


//#region listeners
window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}


document.addEventListener('keydown', function (event) {

});
//#endregion

window.onload = initScene();