import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Culling/ray";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

import { RadialCloner } from "../clonerSystem";
import { CMesh, RandomEffector } from "../clonerSystem/core";

import {
    Color3,
    Mesh,
    MeshBuilder,
    TransformNode,
    VertexData,
} from "@babylonjs/core";

import * as YUKA from "yuka";
import { Nullable } from "@babylonjs/core/types";

export type FlatMatrix4x4 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];

export const ZERO = new YUKA.Vector3();

export class GoalScene implements CreateSceneClass {
    private _time: YUKA.Time = new YUKA.Time();
    private _entityManager = new YUKA.EntityManager();
    private _target!: YUKA.GameEntity;

    private _scene!: Scene;
    private _targetMesh!: Mesh;
    private _vehicleMesh!: Mesh;

    positionArray: any;

    createScene = async (
        engine: AbstractEngine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        this._scene = scene;

        // Uncomment to load the inspector (debugging) asynchronously

        // void Promise.all([
        //     import("@babylonjs/core/Debug/debugLayer"),
        //     import("@babylonjs/inspector"),
        // ]).then((_values) => {
        //     console.log(_values);
        //     scene.debugLayer.show({
        //         handleResize: true,
        //         overlay: true,
        //         globalRoot: document.getElementById("#root") || undefined,
        //     });
        // });

        // This creates and positions a free camera (non-mesh)
        const camera = new ArcRotateCamera(
            "my first camera",
            0,
            Math.PI / 3,
            10,
            new Vector3(0, 0, 0),
            scene
        );

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // Our built-in 'sphere' shape.

        // Our built-in 'ground' shape.
        const ground = CreateGround("ground", { width: 20, height: 20 }, scene);

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;
        ground.position.y -= 0.25;

        const box = MeshBuilder.CreateBox("box");

        const cylinder = MeshBuilder.CreateCylinder("cyl");

        const light = new DirectionalLight(
            "light",
            new Vector3(0, -1, 1),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;

        //
        //
        const vehicleMesh = MeshBuilder.CreateCylinder(
            "cone",
            { height: 0.5, diameterTop: 0, diameterBottom: 0.25 },
            this._scene
        );
        vehicleMesh.rotation.x = Math.PI * 0.5;
        vehicleMesh.bakeCurrentTransformIntoVertices();
        this._vehicleMesh = vehicleMesh;

        // const vehicle = new YUKA.Vehicle();

        //   vehicle.setRenderComponent(this._vehicleMesh, this._sync);

        //    this._entityManager.add(vehicle);

        //
        const collectibleMat = new StandardMaterial("collectibleMat", scene);
        collectibleMat.emissiveColor = Color3.FromHexString("#0000cd");

        const collectibleMat1 = new StandardMaterial("collectibleMat1", scene);
        collectibleMat1.emissiveColor = Color3.FromHexString("#ff00ff");

        /*
        for (let i = 0; i < 50; i++) {
            const collectibleMesh = MeshBuilder.CreateBox(
                "box",
                { size: 0.2 },
                scene
            );
            */
        const collectibleMesh = MeshBuilder.CreateBox(
            "box",
            { size: 0.2 },
            scene
        );
        collectibleMesh.material = collectibleMat;

        const rc = new RadialCloner([collectibleMesh], scene, {
            count: 60,
            radius: 20,
        });

        const reff = new RandomEffector();

        reff.position = { x: 0, y: 0, z: 10 };

        //     rc.addEffector(reff, 1);

        //    mc.addEffector(reff, 1);

        //     oc.addEffector(reff, 1);

        //      lc.addEffector(reff, 1);

        reff.strength = 0.5;
        reff.updateClients();
        rc.addEffector(reff, 1);

        console.log(rc);
        let posArray: CMesh[] = [];
        rc._clones.forEach((c) => {
            posArray.push(c);
        });
        console.log(posArray);

        // this.positionArray = posArray;

        posArray.forEach((element: any) => {
            const collectible = new Collectible(scene);
            collectible.setRenderComponent(element, this._sync);
            collectible.position.x = element.position.x;
            collectible.position.y = element.position.y;
            collectible.position.z = element.position.z;
            this._entityManager.add(collectible);
        });

        //  collectible.spawn(posArray);

        const girl = new Girl();
        girl.name = "Yuka";
        girl.setRenderComponent(this._vehicleMesh, this._sync);
        this._entityManager.add(girl);

        //
        this._scene.onBeforeRenderObservable.add(() => {
            const delta = this._time.update().getDelta();
            //  console.log(delta);
            //   this._entityManager.update(delta); // YUKA world

            //     house.position.z += 0.001;

            //center.rotation.copy(center.rotation.fromEuler(0, 0 + delta, 0));
            //   house.rotation = center.rotation;

            this._entityManager.update(delta); // YUKA world
            /*
            if (this.energyGridRegulator.ready()) {
                console.log("READY");
            }
*/
        });
        //

        //
        return scene;
    };

    private _sync(entity: YUKA.GameEntity, renderComponent: TransformNode) {
        Matrix.FromValues(
            ...(entity.worldMatrix.elements as FlatMatrix4x4)
        ).decomposeToTransformNode(renderComponent);
    }
}

export default new GoalScene();

export class Collectible extends YUKA.GameEntity {
    constructor(scene: any) {
        super();
    }

    spawn() {
        //  this.position.z = randomInteger(0, 50);

        //  if (this.position.x < 50 && this.position.x > -1) this.position.x += 1;
        //  if (this.position.z < 1 && this.position.z > -1) this.position.z += 1;

        console.log("Collectible spawned ");
    }

    handleMessage(telegram: any) {
        const message = telegram.message;

        switch (message) {
            case "PickedUp":
                //  this.spawn();
                console.log(this);
                console.log((this as any)._renderComponent);
                (this as any)._renderComponent.dispose();
                this.manager!.remove(this);

                return true;

            default:
                console.warn("Collectible: Unknown message.");
        }

        return false;
    }
}

//

class RestEvaluator extends YUKA.GoalEvaluator<YUKA.GameEntity> {
    calculateDesirability(girl: any) {
        return girl.tired() === true ? 1 : 0;
    }

    setGoal(girl: any) {
        const currentSubgoal = girl.brain.currentSubgoal();

        if (currentSubgoal instanceof RestGoal === false) {
            girl.brain.clearSubgoals();

            girl.brain.addSubgoal(new RestGoal(girl));
        }
    }
}

class GatherEvaluator extends YUKA.GoalEvaluator<YUKA.GameEntity> {
    calculateDesirability() {
        return 0.5;
    }

    setGoal(girl: any) {
        const currentSubgoal = girl.brain.currentSubgoal();

        if (currentSubgoal instanceof GatherGoal === false) {
            girl.brain.clearSubgoals();

            girl.brain.addSubgoal(new GatherGoal(girl));
        }
    }
}

//

const REST = "REST";
const GATHER = "GATHER";
const FIND_NEXT = "FIND NEXT";
const SEEK = "SEEK";
const PICK_UP = "PICK UP";
const PLACEHOLDER = "-";

const WALK = "WALK";
const RIGHT_TURN = "RIGHT_TURN";
const LEFT_TURN = "LEFT_TURN";
const IDLE = "IDLE";

const inverseMatrix = new YUKA.Matrix4();
const localPosition = new YUKA.Vector3();

class RestGoal extends YUKA.Goal<YUKA.GameEntity> {
    constructor(owner: any) {
        super(owner);
    }

    activate() {
        const owner = this.owner;

        //  owner.ui.currentGoal.textContent = REST
        //   owner.ui.currentSubgoal.textContent = PLACEHOLDER
        //  owner.ui.fatigueLevel.value = owner.fatigueLevel

        console.log("REST GOAL");
        //
        //  const walk = owner.animations.get(WALK)
        //  walk.stop()

        //  const idle = owner.animations.get(IDLE)
        //  idle.play()
        //  idle.loopAnimation = true
    }

    execute() {
        const owner = this.owner as any;

        owner!.currentTime += owner.deltaTime;

        if (owner.currentTime >= owner.restDuration) {
            this.status = YUKA.Goal.STATUS.COMPLETED;
        }
    }

    terminate() {
        const owner = this.owner as any;

        owner.currentTime = 0;
        owner.fatigueLevel = 0;
    }
}

//

class GatherGoal extends YUKA.CompositeGoal<YUKA.GameEntity> {
    constructor(owner: any) {
        super(owner);
    }

    activate() {
        this.clearSubgoals();

        const owner = this.owner as any;

        //   owner.ui.currentGoal.textContent = GATHER

        console.log("GATHER GOAL");

        this.addSubgoal(new FindNextCollectibleGoal(owner));
        this.addSubgoal(new SeekToCollectibleGoal(owner));
        this.addSubgoal(new PickUpCollectibleGoal(owner));

        console.log("fatigueLevel", owner!.fatigueLevel);

        owner.ui.fatigueLevel.value = owner.fatigueLevel;

        //	const idle = owner.animations.get( IDLE );
        //	idle.stop( );
    }

    execute() {
        this.status = this.executeSubgoals();

        this.replanIfFailed();
    }
}

//

class FindNextCollectibleGoal extends YUKA.Goal<YUKA.GameEntity> {
    constructor(owner: any) {
        super(owner);

        //  this.animationId = null;
    }

    activate() {
        const owner = this.owner as any;

        // update UI

        //   owner.ui.currentSubgoal.textContent = FIND_NEXT;

        console.log("FindNextCollectibleGoal");

        // select closest collectible

        const entities = owner!.manager.entities;
        let minDistance = Infinity;

        for (let i = 0, l = entities.length; i < l; i++) {
            const entity = entities[i];

            if (entity !== owner) {
                const squaredDistance = owner.position.squaredDistanceTo(
                    entity.position
                );

                if (squaredDistance < minDistance) {
                    minDistance = squaredDistance;
                    owner.currentTarget = entity;
                }
                //	console.log("owner.currentTarget ", owner.currentTarget.position)
            }
        }

        // determine if the girl should perform a left or right turn in order to face
        // the collectible

        owner.worldMatrix.getInverse(inverseMatrix);
        localPosition
            .copy(owner.currentTarget.position)
            .applyMatrix4(inverseMatrix);

        //  this.animationId = localPosition.x >= 0 ? LEFT_TURN : RIGHT_TURN;

        //   console.log("this.animationId ", this.animationId);

        //  const turn = owner.animations.get(this.animationId);

        //  turn.play();
        //  turn.loopAnimation = false;
    }

    execute() {
        const owner = this.owner as any;

        if (owner.currentTarget !== null) {
            if (
                owner.rotateTo(
                    owner.currentTarget.position,
                    owner.deltaTime
                ) === true
            ) {
                this.status = YUKA.Goal.STATUS.COMPLETED;
            }
        } else {
            this.status = YUKA.Goal.STATUS.FAILED;
        }
    }

    terminate() {
        const owner = this.owner;

        //   const turn = owner.animations.get(this.animationId)
        //  turn.stop()
    }
}

//

class SeekToCollectibleGoal extends YUKA.Goal<YUKA.GameEntity> {
    constructor(owner: any) {
        super(owner);
    }

    activate() {
        const owner = this.owner as any;

        // update UI

        //    owner.ui.currentSubgoal.textContent = SEEK;

        console.log("SeekToCollectibleGoal");

        //

        if (owner.currentTarget !== null) {
            const arriveBehavior = owner.steering.behaviors[0];
            arriveBehavior.target = owner.currentTarget.position;
            arriveBehavior.active = true;
        } else {
            this.status = YUKA.Goal.STATUS.FAILED;
        }

        //

        //   const walk = owner.animations.get(WALK);
        //  walk.play();
        //  walk.loopAnimation = true;
    }

    execute() {
        if (this.active()) {
            const owner = this.owner as any;

            const squaredDistance = owner.position.squaredDistanceTo(
                owner.currentTarget.position
            );

            if (squaredDistance < 0.25) {
                this.status = YUKA.Goal.STATUS.COMPLETED;
            }

            // adjust animation speed based on the actual velocity of the girl
            /*
            const animation = owner.animations.get(WALK);
            animation.speedRatio = Math.min(
                0.75,
                owner.getSpeed() / owner.maxSpeed
            );
            */
            //	console.log(animation.speedRatio)
        }
    }

    terminate() {
        const arriveBehavior = (this.owner as any)!.steering.behaviors[0];
        arriveBehavior.active = false;
        (this.owner as any).velocity.set(0, 0, 0);

        const owner = this.owner;
    }
}

//

class PickUpCollectibleGoal extends YUKA.Goal<YUKA.GameEntity> {
    collectibleRemoveTimeout: number;
    constructor(owner: any) {
        super(owner);

        this.collectibleRemoveTimeout = 3; // the time in seconds after a collectible is removed
    }

    activate() {
        const owner = this.owner as any;

        //       owner.ui.currentSubgoal.textContent = PICK_UP;
        /*
        const gather = owner.animations.get(GATHER);
        gather.play();
        gather.loopAnimation = true;
        */
        console.log("PickUpCollectibleGoal");
    }

    execute() {
        const owner = this.owner as any;
        owner.currentTime += owner.deltaTime;

        if (owner.currentTime >= owner.pickUpDuration) {
            this.status = YUKA.Goal.STATUS.COMPLETED;

            console.log("PickedUp Completed ");
        } else if (owner.currentTime >= this.collectibleRemoveTimeout) {
            if (owner.currentTarget !== null) {
                owner.sendMessage(owner.currentTarget, "PickedUp");
                console.log("PickedUp sendMessage Completed ");
                owner.currentTarget = null;
            }
        }
    }

    terminate() {
        const owner = this.owner as any;

        owner.currentTime = 0;
        owner.fatigueLevel++;
        /*
        const gather = owner.animations.get(GATHER);
        gather.stop();
        */
    }
}
//
//////////////////////////////////

class Girl extends YUKA.Vehicle {
    ui: {
        currentGoal: HTMLElement | null;
        currentSubgoal: HTMLElement | null;
        fatigueLevel: HTMLElement | null;
    };
    brain: YUKA.Think<this>;
    fatigueLevel: number;
    restDuration: number;
    pickUpDuration: number;
    crossFadeDuration: number;
    currentTarget: null;
    currentTime: number;
    deltaTime: number;
    MAX_FATIGUE: number;
    constructor() {
        super();

        this.maxTurnRate = Math.PI * 0.5;
        this.maxSpeed = 1.5;

        this.ui = {
            currentGoal: document.getElementById("warehouse"),
            currentSubgoal: document.getElementById("drone"),
            fatigueLevel: document.getElementById("building"),
        };

        // goal-driven agent design

        this.brain = new YUKA.Think(this);

        this.brain.addEvaluator(new RestEvaluator());
        this.brain.addEvaluator(new GatherEvaluator());

        // steering

        const arriveBehavior = new YUKA.ArriveBehavior();
        arriveBehavior.deceleration = 1.5;
        this.steering.add(arriveBehavior);

        //

        this.fatigueLevel = 0; // current level of fatigue
        this.restDuration = 5; //  duration of a rest phase in seconds
        this.pickUpDuration = 6; //  duration of a pick phase in seconds
        this.crossFadeDuration = 0.5; // duration of a crossfade in seconds
        this.currentTarget = null; // current collectible

        this.currentTime = 0; // tracks the current time of an action
        this.deltaTime = 0; // the current time delta value

        this.MAX_FATIGUE = 3; // the girl needs to rest if this amount of fatigue is reached
    }

    update(delta: number) {
        super.update(delta);

        this.deltaTime = delta;

        this.brain.execute();

        this.brain.arbitrate();

        return this;
    }

    tired() {
        return this.fatigueLevel >= this.MAX_FATIGUE;
    }
}
export function randomInteger(min: number, max: number) {
    // случайное число от min до (max+1)
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}
