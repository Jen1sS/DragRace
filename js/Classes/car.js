import * as THREE from 'three';
import {ModelImporter} from "./importers.js";

const mi = new ModelImporter();

export class Car extends THREE.Object3D {
    constructor(path,speed,accel) {
        super();
        this.ready=false;
        this.identifier = path;

        this.MaxSpeed = speed;
        this.speed = 0;
        this.accel = accel;

        this.scale.set(7,7,7);

        mi.importWithName("../../Models/"+path, path);

        this.hasLoaded(1000);
    }

    hasLoaded(timeout) {
        setTimeout(() => {
            if (mi.everythingLoaded()){
                mi.addShadows(this.identifier)
                const car = mi.getModel(this.identifier);

                super.add(car);

                this.ready = true;
            } else this.hasLoaded(timeout);
        })
    }


    isReady(){
        return this.ready;
    }

    update(dt){
        if (this.speed < 0.1) this.speed=0;
        else if (this.speed > this.MaxSpeed) this.speed = this.MaxSpeed;
        else this.speed-=this.accel*dt;
    }

    increase(dt){
        this.speed+=this.accel*dt*15;
    }
}