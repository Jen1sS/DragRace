import * as THREE from "three";
import {ModelImporter} from "../Classes/importers.js";
import {Vector2, Vector3} from "three";
import {debug} from "../render.js";


let car;
let headlights = [];

const mi = new ModelImporter()

let raceProgression = 0;

const racePoints = [new Vector3(69, 2.6, 3.3), new Vector3(-340.5, 2.6, 30), new Vector3(-606, 2.6, -296)]

export class Game extends THREE.Scene {
    constructor(selected, camera) {
        super();

        this.camera = camera;
        car = selected;
        mi.importWithName("../../Models/road.glb", "world");
        this.ready = false;

        this.hasLoaded(1000);

    }

    hasLoaded(timeout) {
        setTimeout(() => {
            if (mi.everythingLoaded()) this.generate();
            else this.hasLoaded(timeout);
        })
    }

    generate() {
        mi.addShadows("world");

        super.add(car);
        super.add(mi.getModel("world"));

        if (debug) this.camera.position.set(0, 3, 5);
        else this.camera.position.set(-3, 3, 5);
        this.camera.lookAt(car.position)

        car.add(this.camera)
        car.position.set(69, 2.6, 3.3);
        car.rotation.y = -Math.PI / 2
        car.scale.set(1.5, 1.5, 1.5);

        let target = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshNormalMaterial());
        target.position.set(0,0,100);
        car.add(target)

        //TODO: USA SPOTLIGHT
        for (let i = 0; i < 2; i++) {
            headlights.push(new THREE.SpotLight(0xffffff, 10));

            headlights[i].castShadow = true;
            headlights[i].shadow.bias = -0.002
            headlights[i].shadow.mapSize = new Vector2(1024, 1024)
            headlights[i].target = target;
            headlights[i].position.set(i-0.4,1,1.8)


            car.add(headlights[i]);
            this.ready = true;
        }

        super.add(new THREE.AmbientLight(0xffffff, 0.4));


    }

    update(dt) {
        this.camera.lookAt(car.position)

        //TODO: ORDINA
        if (mi.everythingLoaded()) {
            raceProgression += (dt * car.speed) / 100;
            car.update(dt);

            if (raceProgression <= 1) {
                car.position.x = beizerFormula(racePoints[0].x, racePoints[1].x, racePoints[2].x, raceProgression)
                car.position.z = beizerFormula(racePoints[0].z, racePoints[1].z, racePoints[2].z, raceProgression)

                car.rotation.y = lerp(-Math.PI / 2, -2.5, raceProgression);
            }
        }

        console.log(car)
    }

    getCar() {
        return car;
    }
}

function beizerFormula(p1, p2, p3, alpha) {
    const alphaC = 1 - alpha;
    return alphaC ** 2 * p1 + 2 * alphaC * alpha * p2 + alpha ** 2 * p3;
}

function lerp(p1, p2, alpha) {
    return p1 + (p2 - p1) * alpha;
}
