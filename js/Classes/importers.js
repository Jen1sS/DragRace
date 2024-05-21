import {GLTFLoader} from "gltf";
import * as THREE from 'three';
import {AnimationMixer} from "three";
import {TextGeometry} from '../../node_modules/three/examples/jsm/geometries/TextGeometry.js';
import {FontLoader} from "../../node_modules/three/examples/jsm/loaders/FontLoader.js";

const loaderGLTF = new GLTFLoader();
const encoder = new TextEncoder('utf-16');



export class ModelImporter {
    constructor() {
        this.elToAdd = 0;
        this.elementsLoaded = {};
    }


    async import(path) {
        this.importWithName(path, path)
    }

    async importWithName(path, name) {
        this.elToAdd++;
        await loaderGLTF.load(
            // resource URL
            path,
            // called when the resource is loaded
            (modello) => {
                this.elToAdd--;
                this.elementsLoaded[name] = modello.scene;
            },
            // called while loading is progressing
            (xhr) => {
                if (xhr.loaded === xhr.total) {
                    console.log("ModelImporter - loaded " + name);
                } else {
                    //console.log("ModelImporter - loading " + path);
                }
            },
            // called when loading has errors
            (error) => {
                console.log("ModelImporter - error:" + error);
            }
        );
    }

    addShadows(pathOrName) {
        this.elementsLoaded[pathOrName].traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
    }

    everythingLoaded() {
        return this.elToAdd === 0;
    }

    getModel(pathOrName) {
        return this.elementsLoaded[pathOrName];
    }

    clear() {
        this.elementsLoaded = {};
    }
}

export class AnimationManager {
    constructor(linker) {
        this.elToAdd = 0;
        this.animations = {};
        this.activeAction = null;
        this.lastAction = null;
        this.mixer = new AnimationMixer(linker);
        this.playing = false;
    }

    async import(path, name) {
        this.elToAdd++;
        await loaderGLTF.load(
            // resource URL
            path,
            // called when the resource is loaded
            (animation) => {
                this.elToAdd--;
                this.animations[name] = animation.animations[0];
            },
            // called while loading is progressing
            (xhr) => {
                if (xhr.loaded === xhr.total) {
                    console.log("AnimationImporter - loaded " + path);
                } else {
                    //console.log("AnimationImporter - loading " + path);
                }
            },
            // called when loading has errors
            (error) => {
                console.log("AnimationImporter - error:" + error);
            }
        );
    }

    everythingLoaded() {
        return this.elToAdd === 0;
    }

    isPlaying() {
        return this.playing
    }

    playAnimation(name) {
        this.activeAction = this.mixer.clipAction(this.animations[name]);
        this.activeAction.play();
        this.playing = true;
    }


    lastCalled;

    transitionTo(name, time) {
        if (this.lastCalled !== name) {

            this.lastAction = this.activeAction;
            this.activeAction = this.mixer.clipAction(this.animations[name]);


            this.lastAction.play();
            this.lastAction.crossFadeTo(this.activeAction, time, false);
            this.activeAction.enabled = true;
            this.activeAction.play();


            this.playing = true;
        }
        this.lastCalled = name;
    }

    stopAll() {
        this.mixer.stopAllAction();
    }

    update(dt) {
        this.mixer.update(dt);
    }

    doOnce(name, time) {
        const nextAction = this.mixer.clipAction(this.animations[name]);
        nextAction.clampWhenFinished = true;
        nextAction.repetitions = 1;

        this.activeAction.crossFadeTo(nextAction, time, false);
        setTimeout(() => {
            this.stopAll();
            this.playAnimation(name)
            this.playing = false;
        }, time);
        this.playing = true;
        this.lastCalled = name;

    }

    transitionAndDoOnce(name, time) {
        this.lastAction = this.activeAction;
        this.activeAction = this.mixer.clipAction(this.animations[name]);


        this.lastAction.play();
        this.lastAction.crossFadeTo(this.activeAction, time, false);
        this.activeAction.enabled = true;
        this.activeAction.clampWhenFinished = true;
        this.activeAction.repetitions = 1;
        this.activeAction.play();

        this.playing = true;
    }

    setPlaybackSpeed(value) {
        if (this.activeAction !== null) this.activeAction.timeScale = value;
    }
}

export class AudioManager {
    constructor(linker) {
        this.elToAdd = 0;
        this.audioLoaded = {};
        this.audios = {};
        this.loader = new THREE.AudioLoader();
        this.sound = linker;
    }

    async import(path, name) {
        this.elToAdd++;

        await this.loader.load(
            path,
            (buffer) => {
                this.elToAdd--;

                if (name === undefined) this.audioLoaded[path] = buffer;
                else this.audioLoaded[name] = buffer;
            },
            (xhr) => {
                if (xhr.loaded === xhr.total) {
                    console.log("AudioManager - loaded " + path);
                }
            });
    }

    play(name, looping, volume, speedOrPitch, changePitch) {
        if (this.audios[name] === undefined) this.audios[name] = new THREE.Audio(this.sound);
        if (this.audios[name] !== undefined && this.audios[name].isPlaying === false) {
            this.audios[name].setBuffer(this.audioLoaded[name]);
            this.audios[name].setLoop(looping);
            this.audios[name].setVolume(volume);
            this.audios[name].play();
        }
        if (speedOrPitch !== undefined) {
            if (changePitch !== undefined && changePitch) this.audios[name].detune = speedOrPitch;
            else this.audios[name].setPlaybackRate(speedOrPitch);
        }

    }

    stop(name) {
        this.audios[name].stop();
    }

    setPlayBackSpeed(name, speed) {
        this.audios[name].playbackRate = speed;
    }

    everythingLoaded() {
        return this.elToAdd === 0;
    }
}

export class FontManager {
    constructor() {
        this.elToAdd = 0;
        this.fonts = {};
        this.loader = new FontLoader();

        this.lastW=0;
        this.lastH=0;
    }

    import(path, name) {
        this.elToAdd++;
        this.loader.load(
            path,
            (font) => {
                this.elToAdd--;
                this.fonts[name] = font;
            },
            (xhr) => {
                if (xhr.loaded === xhr.total) {
                    console.log("FontManager - loaded " + path);
                }
            }
        )
    }

    getNewText(content, height, size, font,length) {
        if (length===undefined) length = 20;
        let w = 0;
        let h = 0;
        let last = 0;
        for (let i = 0; i < content.length; i++) {
            if (content.charAt(i) === ' ' && i-last>length){
                content = content.slice(0, i) + "\n" + content.slice(i);
                if (w < (i-last)*size) w = (i-last)*size;
                h+=height;
                last=i;
            }
        }

        const ret = new THREE.Mesh(
            new TextGeometry(content, {
                height: height,
                size: size,
                font: this.fonts[font],
            }),
            new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
            })
        )
        this.lastW = w;
        this.lastH = h;

        ret.castShadow = true;
        ret.receiveShadow = true;
        return ret;
    }

    getWidth(){
        return this.lastW;
    }

    getHeight(){
        return this.lastH;
    }

    everythingLoaded() {
        return this.elToAdd === 0;
    }
}