import * as THREE from 'three';
import {ModelImporter} from "../Classes/importers.js";
import {AmbientLight, PointLight, Vector2, Vector3} from "three";
import {Car} from "../Classes/car.js";
import {debug} from "../render.js";


const models = ["newGarage.glb", "sky.glb", "arrows.glb", "selArrow.glb"];

let lastSelections = null;
let selCar = null;

export let shadows = false;

const cars = [
    new Car("lambo.glb", 5,2),
    new Car("f40.glb", 8,2),
    new Car("silvia.glb", 2,0.6),
    new Car("gallardo.glb",5,3.5),
    new Car("supra.glb",4,3),
    new Car("skyline.glb",4,3),
    new Car("gt33.glb",4,3),
    new Car("m6.glb",10,1)
]

const mi = new ModelImporter();

let animateArrow = false;
let back = false;

const lightPos = [38.5, -0.5, -38.5]
let lights = [];

let garageDoor = null;
let openG = false;
const carXPos = [-29,-5.5,18.5,43.5]

export class Garage extends THREE.Scene {

    constructor() {
        super();

        this.loaded = false;

        //#region IMPORTING MODELS
        for (let i = 0; i < models.length; i++) mi.importWithName("../../Models/" + models[i], models[i]);
        //#endregion

        this.hasLoaded(1000);
    }

    hasLoaded(timeout) {
        setTimeout(() => {
            let carsReady = true;
            for (let i = 0; i < cars.length; i++) carsReady = cars[i].isReady() && carsReady;

            if (mi.everythingLoaded() && carsReady) this.generate();
            else this.hasLoaded(timeout);
        })
    }

    generate() {
        let xcord = -1;

        //#region CAR GENERATION
        for (let i = 0; i < cars.length; i++) {
            let position = new THREE.Vector3(0, -7.5, 0);
            let rotation = new Vector3(0, 0, 0);

            if (i%2===0){
                position.z = -18.5;
                rotation.y = Math.PI/4;
                xcord++;
            } else{
                position.z = 18.5;
                rotation.y = + 3*Math.PI/4
            }

            position.x = carXPos[xcord]



            cars[i].position.set(position.x, position.y, position.z)
            cars[i].rotation.set(rotation.x, rotation.y, rotation.z)

            super.add(cars[i]);
        }
        //#endregion

        //#region MODEL SETUP
        for (let i = 0; i < models.length; i++) {
            mi.addShadows(models[i])
            if (i === 1) mi.getModel(models[i]).scale.set(1000, 1000, 1000);
            if (i !== 3) super.add(mi.getModel(models[i]))
        }

        const arr = mi.getModel(models[2]);
        arr.position.set(-65, -7, 0)
        arr.scale.set(3, 3, 3)
        arr.rotation.x += Math.PI / 2

        //#endregion

        //#region LIGHT SETUP
        super.add(new AmbientLight(0xffffff, 0.02))
        for (let i = 0; i < lightPos.length; i++) {
            const intensity = 500;
            const color = 0xffffff
            const light = []

            for (let j = 0; j < 2; j++) {
                light.push(new PointLight(color, intensity));
                lights.push(new PointLight(color, intensity));
                light[j].position.set(lightPos[i], 7, -16.5 + 34.5 * j);
                //light[j].lookAt(lightPos[i], 6, -16.5 + 34.5 * j)

                light[j].shadow.bias = -0.002
                light[j].shadow.mapSize = new Vector2(1024, 1024)
                if (shadows) {
                    light[j].castShadow = true;
                    light[j].receiveShadow = true;
                }

                //super.add(new PointLightHelper(light[j]));
                super.add(light[j])
            }
        }
        //#endregion

        this.loaded = true;
    }


    returning = false;
    returning2 = false;

    update(dt) {
        dt *= 2;

        if (mi.everythingLoaded()) {
            mi.getModel(models[1]).rotation.y += 0.02 * dt;

            const a = mi.getModel(models[2])
            const b = mi.getModel(models[3])

            if (a.position.y < -5 && !this.returning) a.position.y += 0.5 * dt; //ANIMATION OF BLUE ARROW
            else if (a.position.y > -6) {
                this.returning = true
                a.position.y -= 0.5 * dt;
            } else this.returning = false

            if (animateArrow) { //SAME BUT WHEN CLICKED
                if (a.position.y < 0) a.position.y -= (a.position.y - 1) * 4 * dt;
                else a.rotation.x += Math.PI * dt;
            } else if (back) {
                if (a.rotation.x > Math.PI / 2) a.rotation.x -= a.rotation.x * dt;
                else if (a.position.y > -5) a.position.y -= 4 * dt;
            }

            if (lastSelections !== null) { //ANIMATION OF RED ARROW
                b.rotation.y += Math.PI * dt;
                if (b.position.y < 4 && !this.returning) b.position.y += 0.6 * dt;
                else if (b.position.y > 3) {
                    this.returning2 = true
                    b.position.y -= 0.6 * dt;
                } else this.returning2 = false
            }

            if (garageDoor != null) {
                if (openG && garageDoor.position.y < 5) garageDoor.position.y += dt;  //OPENING OF GARAGE DOOR
                else if (!openG && garageDoor.position.y > 0) garageDoor.position.y -= dt;  //OPENING OF GARAGE DOOR
            }
        }
    }

    //
    select(raycast) {
        let select = null;

        if (!animateArrow) { //find car selected if not pressed ready (blue arrow)
            for (let i = 0; i < cars.length; i++) if (raycast.intersectObject(cars[i]).length!==0) selCar = select = cars[i];
        }


        if (select !== null) { //setup to arrow and light on top of car selected
            if (lastSelections !== null) for (let i = 0; i < lastSelections.length; i++) {
                super.remove(lastSelections[i]);
            }

            const light = new THREE.PointLight(0xff0000, 1000);
            light.position.set(select.position.x, 5, select.position.z)

            const sel = mi.getModel(models[3]);

            sel.position.set(select.position.x, 3, select.position.z)
            sel.scale.set(0.5, 0.5, 0.5)
            sel.rotation.z = Math.PI / 2

            super.add(sel);
            super.add(light);

            lastSelections = [light, sel];
        } else {
            if (raycast.intersectObject(mi.getModel(models[2])).length!==0){
                if (!animateArrow && lastSelections !== null && !openG) animateArrow = true
                else if (animateArrow) {
                    back = true;
                    animateArrow = false;
                }
            }
        }
    }

    selectGarageDoor(objectName) {
        const garage = this

        garage.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh && objectName === mesh.name && objectName === "Object_82001") {
                if (mi.getModel(models[2]).rotation.x > Math.PI / 2){
                    back = true
                    animateArrow = false;
                    openG = true;
                }
                garageDoor = mesh;
                return;
            } else if (mesh instanceof THREE.Mesh && objectName === mesh.name && objectName === "Sphere_Skybox_0") openG = false;
        })

        return openG;

    }

    enableShadow(state, camera) {
        shadows = state
        for (let i = 0; i < lights.length; i++) {
            lights[i].castShadow = state;
            lights[i].receiveShadow = state;
        }
        camera.updateProjectionMatrix()
    }

    getSelected(){
        return selCar;

    }
}

