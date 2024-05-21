import * as THREE from 'three';
import {Garage, shadows} from "./Scene/garage.js";
import Stats from "../node_modules/stats.js/src/Stats.js"
import WebGPURenderer from '../node_modules/three/examples/jsm/renderers/webgpu/WebGPURenderer.js';
import {Raycaster, Vector3, } from "three";
import {Game} from "./Scene/game.js";


let gl = null;
let renderer = null;

let garage = null;
let game = null;

let camera = null;
let clock = null;
let stats = null;


let curScene = "GARAGE";
let curState = "START";


export let debug = false;

let dt;

//SCENE GARAGE
let targets = 3;
let carX = [-5.5, 18.5, 43.5, 67];
let nextid = null;

//POINTER
let raycast = new Raycaster();
let pointer = new THREE.Vector2();

//LOOK
let newLook;
let lookingAt = new Vector3(-29, -7, 0);


//4dabc0f1fa1fbda624ab891151f7c187 APIKEY https://threejs.org/build/three.module.js
function initScene() {

    if (renderer != null) return;

    document.body.innerHTML = "";

    let width = window.innerWidth;
    let height = window.innerHeight;


    if (debug) renderer = new WebGPURenderer({precision: "highp", antialias: "true"});
    else renderer = new THREE.WebGLRenderer({antialias: "true"});

    renderer.autoClear = false;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setClearColor("black", 1);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 60000);
    camera.position.set(-9.5, 4, -0);
    camera.lookAt(-29, -7, 0);


    clock = new THREE.Clock();


    garage = new Garage();


    renderer.setAnimationLoop(animate);

    stats = Stats()
    stats.showPanel(0)
    document.body.appendChild(stats.dom)
}

function animate() {
    renderer.clear();
    stats.end();

    stats.begin();

    dt = clock.getDelta();

    switch (curScene) {
        case "GARAGE":
            if (garage.loaded) {
                garage.update(dt);
                switch (curState) {
                    case "START":
                        if (debug) curState = "SELECTION";
                        if (camera.position.x < 65) {
                            camera.position.x += 25 * dt;
                            camera.lookAt(-29, -7, 0);
                        } else curState = "SELECTION";
                        break;
                    case "MOVINGS":
                        if (Math.abs(camera.position.x - carX[targets]) > 1 && !debug) {
                            if (newLook !== undefined && !areVectorsEqual(newLook, lookingAt, 0.5)) lerpCameraVision(lookingAt, newLook, dt * 2);
                            else {
                                newLook = new Vector3(-29, -7, 0);
                                camera.position.x -= (camera.position.x - carX[targets]) * dt;
                                camera.lookAt(-29, -7, 0);
                            }
                        } else curState = "SELECTION";
                        break;
                    case "SELECTION":
                        if (newLook !== undefined && !areVectorsEqual(newLook, lookingAt, 0.2)) lerpCameraVision(lookingAt, newLook, dt * 2);
                        break;
                    case "END":
                        if (camera.position.x > -65 && !debug) camera.position.x -= (camera.position.x + 68) * dt;
                        else{
                            game = new Game(garage.getSelected(),camera);
                            curScene = "GAME";
                            curState = "START";
                        }
                }

                renderer.render(garage, camera);
            }
            break;
        case "GAME":
            renderer.render(game, camera);
            if (game.ready) {
                game.update(dt);
                //if (newLook !== undefined && !areVectorsEqual(newLook, lookingAt, 0.2) && debug) lerpCameraVision(lookingAt, newLook, dt * 2);
            }
            break;
    }

}


export function areVectorsEqual(v1, v2, delta) {
    return Math.abs(v1.x - v2.x) < delta && Math.abs(v1.y - v2.y) < delta && Math.abs(v1.z - v2.z) < delta
}

function lerpCameraVision(v1, v2, alpha) {
    let currentLookAt = v1;
    currentLookAt.lerp(v2, alpha);
    camera.lookAt(currentLookAt);
}

//#region INPUT MANAGEMENT
window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}


window.addEventListener('pointerdown', function (event) {
    if (event.pressure > 0) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycast.setFromCamera(pointer, camera);

        let intersects;

        switch (curScene.concat(curState)) {
            case "GARAGESELECTION":
                intersects = raycast.intersectObjects(garage.children);
                garage.select(raycast);

                const time = debug?1:5000;

                if (garage.selectGarageDoor(intersects[0].object.name)) nextid = setTimeout(() => {curState = "END"}, time)
                else clearTimeout(nextid);
                curState = "SELECTION"
                break;
            case "GAMESTART":
                if (debug) {
                    intersects = raycast.intersectObjects(garage.children);
                    console.log(intersects[0].point)
                }
                break;
        }

        if (intersects) newLook = intersects[0].point;


    }
});


document.addEventListener('keydown', function (event) {
    if (event.key === "p") garage.enableShadow(!shadows,camera);

    if (event.key === " ") game.getCar().increase(dt);


    if (debug) switch (curScene) {
        case "GARAGE":
            if (event.key === "k") camera.position.x += 1.5;
            if (event.key === "i") camera.position.x -= 1.5;
            if (event.key === "j") camera.position.z += 1.5;
            if (event.key === "l") camera.position.z -= 1.5;
            if (event.key === "u") camera.position.y -= 0.5;
            if (event.key === "o") camera.position.y += 0.5;
            if (event.key === "q") console.log(camera.position)

            break;
        case "GAME":
            if (event.key === "d") game.getCar().position.x += 5;
            if (event.key === "a") game.getCar().position.x -= 5;
            if (event.key === "w") game.getCar().position.z += 5;
            if (event.key === "s") game.getCar().position.z -= 5;
            if (event.key === "u") game.getCar().rotation.y -= 0.5;
            if (event.key === "o") game.getCar().rotation.y += 0.5;
            if (event.key === "q"){
                console.log(game.getCar().position)
                console.log(game.getCar().rotation)
            }
            break;
    }
    if (curState === "SELECTION" || curState === "MOVINGS") {
        if (event.key === "s" && targets < carX.length - 1) targets++;
        if (event.key === "w" && targets > 0) targets--;
        curState = "MOVINGS";
    }
});
//#endregion

window.onload = initScene();