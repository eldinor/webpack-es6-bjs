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

export class Clean2 implements CreateSceneClass {
    private _time: YUKA.Time = new YUKA.Time();
    private _entityManager = new YUKA.EntityManager();
    private _target!: YUKA.GameEntity;

    private _scene!: Scene;
    private _targetMesh!: Mesh;
    private _vehicleMesh!: Mesh;
    private energyGridRegulator: YUKA.Regulator = new YUKA.Regulator(0.2);
    private energyGrid: Array<any> = [];

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

        //
        const warehouse = new Warehouse(
            "warehouse",
            this._entityManager,
            new YUKA.Vector3(-2, 0, -4),
            {}
        );

        warehouse.setRenderComponent(box, this._sync);
        //

        //
        const drone = new Drone("drone", this._entityManager, warehouse);

        drone.setRenderComponent(this._vehicleMesh, this._sync);
        //

        const building = new Building(
            "build",
            this._entityManager,
            new YUKA.Vector3(3, 0, 4),
            { metal: 20 },
            warehouse
        );

        building.setRenderComponent(cylinder, this._sync);

        //
        console.log(this._entityManager);
        //
        this._scene.onBeforeRenderObservable.add(() => {
            const delta = this._time.update().getDelta();

            this._entityManager.update(delta); // YUKA world
            drone.currentTime += delta;
            drone.stateMachine.update();
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

export default new Clean2();

const IDLE = "IDLE";
const WALK = "WALK";
const WORK = "WORK";
const BUILD1 = "BUILD1";
const BUILD2 = "BUILD2";
const UNLOAD = "UNLOAD";
const RETURN = "RETURN";

interface Resource {
    metal?: number;
    water?: number;
}

export class Building extends YUKA.GameEntity {
    stateMachine: YUKA.StateMachine<YUKA.GameEntity>;
    name: string;
    entityManager: YUKA.EntityManager;
    position: YUKA.Vector3;
    buildCost: Resource;
    supply: Resource | undefined;
    warehouse: Warehouse;
    client: YUKA.GameEntity | undefined;
    constructor(
        name: string,
        entityManager: YUKA.EntityManager,
        position: YUKA.Vector3,
        buildCost: Resource,
        warehouse: Warehouse
    ) {
        super();
        this.name = name;
        this.entityManager = entityManager;
        this.entityManager.add(this);
        this.position = position;
        this.buildCost = buildCost;
        this.warehouse = warehouse;
        this.supply = { water: 20 };
        this.stateMachine = new YUKA.StateMachine(this);
        this.stateMachine.add(BUILD1, new Build1State());
        this.stateMachine.add(BUILD2, new Build2State());

        this.stateMachine.changeTo(BUILD1);

        console.log(this);
    }
    update(delta: number) {
        //   this.currentTime += delta;

        this.stateMachine.update();

        return this;
    }
}
class Build1State extends YUKA.State<YUKA.Vehicle> {
    // buildCost: Resource | undefined;

    enter(owner: any) {
        console.log("ENTER Build1State");
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        console.log(owner.buildCost);

        const drone = owner.warehouse.drones[0];
        drone.client = owner;

        if (owner.buildCost.metal > 0) {
            owner.warehouse.drones[0].steering.behaviors[0].target =
                owner.position;
            //   drone.cargo = { metal: 10 };
            console.log(drone.stateMachine);
            drone.stateMachine.changeTo(WALK);
        }

        //
    }

    execute(owner: any) {
        //  console.log(drone.name);
        /*
        if (drone.currentTime > 5) {
            drone.stateMachine.changeTo(WALK);
            drone.currentTime = 0;
            console.log("TIME!");
        }
        */
    }

    exit(owner: any) {}
}

class Build2State extends YUKA.State<YUKA.Vehicle> {
    // buildCost: Resource | undefined;

    enter(owner: any) {
        console.log("ENTER Build2State");
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        console.log(owner.buildCost);

        //
    }

    execute(owner: any) {}

    exit(owner: any) {}
}

export class Warehouse extends YUKA.GameEntity {
    name: string;
    entityManager: YUKA.EntityManager;
    position: YUKA.Vector3;
    buildCost: Resource;
    supply: Resource | undefined;
    drones: Drone[];
    constructor(
        name: string,
        entityManager: YUKA.EntityManager,
        position: YUKA.Vector3,
        buildCost: Resource
    ) {
        super();
        this.name = name;
        this.entityManager = entityManager;
        this.entityManager.add(this);
        this.position = position;
        this.buildCost = buildCost;
        this.supply = { water: 20 };
        this.drones = [];
        console.log(this);
    }
}

export class Drone extends YUKA.Vehicle {
    stateMachine: YUKA.StateMachine<YUKA.Vehicle>;
    entityManager: YUKA.EntityManager;
    position: YUKA.Vector3;
    currentTime: number;
    maxSpeed: number;
    warehouse: Warehouse;
    cargo: Resource;
    constructor(
        name: string,
        entityManager: YUKA.EntityManager,
        warehouse: Warehouse
    ) {
        super();

        this.name = name;
        this.entityManager = entityManager;
        this.entityManager.add(this);
        this.warehouse = warehouse;
        this.position = new YUKA.Vector3().copy(warehouse.position);
        this.currentTime = 0;
        this.maxSpeed = 5;
        this.stateMachine = new YUKA.StateMachine(this);
        this.stateMachine.add(IDLE, new IdleState());
        this.stateMachine.add(WALK, new WalkState());
        this.stateMachine.add(UNLOAD, new UnloadState());
        this.stateMachine.add(RETURN, new ReturnState());
        this.stateMachine.changeTo(IDLE);
        this.warehouse.drones.push(this);
        this.cargo = { metal: 0, water: 0 };

        const arriveBehavior = new YUKA.ArriveBehavior(
            new YUKA.Vector3(),
            2.5,
            0.1
        );
        arriveBehavior.active = false;
        this.steering.add(arriveBehavior);
    }
    /*
    update(delta: number) {
        this.currentTime += delta;

        this.stateMachine.update();

        return this;
    }
    */
}

const droneUI = document.getElementById("drone");

//
//
class IdleState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER IDLE");
        droneUI!.innerHTML = "ENTER IDLE";
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        //  console.log(drone);

        //
    }

    execute(drone: any) {
        //  console.log(drone.name);
        /*
        if (drone.currentTime > 5) {
            drone.stateMachine.changeTo(WALK);
            drone.currentTime = 0;
            console.log("TIME!");
        }
        */
    }

    exit(drone: any) {}
}

class WalkState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER WALK");
        droneUI!.innerHTML = "ENTER WALK";
        drone.currentTime = 0;
        //   drone.velocity = new YUKA.Vector3(0, 0, 0);

        //  console.log(drone.cargo);

        drone.steering.behaviors[0].active = true;
        drone.cargo.metal += 10;
        drone.warehouse.metal -= 10;
        //   drone.steering.behaviors[0].target = new YUKA.Vector3(10, 0, 0);

        //
    }

    execute(drone: any) {
        //  console.log(drone.name);

        const squaredDistance = drone.position.squaredDistanceTo(
            drone.steering.behaviors[0].target
        );
        //  drone.work.position.z += 0.002;

        if (squaredDistance < 0.25) {
            drone.currentTime = 0;
            drone.velocity = new YUKA.Vector3(0, 0, 0);
            drone.stateMachine.changeTo(UNLOAD);
        }
        /*
        if (drone.currentTime > 5) {
            drone.currentTime = 0;
            drone.stateMachine.changeTo(IDLE);
        }
        */
    }

    exit(drone: any) {}
}
//
class UnloadState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER UnloadState");
        droneUI!.innerHTML = "ENTER UNLOAD";
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        //  console.log(drone);
        drone.client.buildCost.metal -= drone.cargo.metal;
        drone.cargo.metal = 0;
        console.log(drone.entityManager);
        drone.stateMachine.changeTo(RETURN);
        //
    }

    execute(drone: any) {}

    exit(drone: any) {}
}
//
class ReturnState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER ReturnState ");
        droneUI!.innerHTML = "ENTER RETURN";
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        //  console.log(drone);

        drone.steering.behaviors[0].target = drone.warehouse.position;
        console.log(drone.entityManager);
        console.log(drone.client.buildCost.metal);
        //
    }

    execute(drone: any) {
        const squaredDistance = drone.position.squaredDistanceTo(
            drone.steering.behaviors[0].target
        );
        //  drone.work.position.z += 0.002;

        if (squaredDistance < 0.25) {
            drone.currentTime = 0;
            drone.velocity = new YUKA.Vector3(0, 0, 0);
            //    console.log(drone.client.buildCost);
            if (drone.client.buildCost.metal > 0) {
                //     console.log("YES");
                //  if (drone.client.buildCost.metal > 0) {
                drone.steering.behaviors[0].target = drone.client.position;
                drone.stateMachine.changeTo(WALK);
                //  }
            }
            if (drone.client.buildCost.metal <= 0) {
                drone.client.stateMachine.changeTo(BUILD2);
                drone.stateMachine.changeTo(IDLE);
            }
        }
        /*

        */
    }

    exit(drone: any) {}
}
