import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CreateSceneClass } from "../createScene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { EnvironmentHelper } from "@babylonjs/core/Helpers/environmentHelper";

// required imports
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Animations/animatable";

// digital assets
import controllerModel from "../../assets/glb/samsung-controller.glb";
import roomEnvironment from "../../assets/environment/room.env";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import {
    Color3,
    Mesh,
    MeshBuilder,
    TransformNode,
    VertexData,
} from "@babylonjs/core";

import * as YUKA from "yuka";

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

export class EnergyTest implements CreateSceneClass {
    private _time: YUKA.Time = new YUKA.Time();
    private _entityManager = new YUKA.EntityManager();
    private _vehicleMesh!: Mesh;
    createScene = async (
        engine: AbstractEngine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

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

        camera.useFramingBehavior = true;

        // load the environment file
        scene.environmentTexture = new CubeTexture(roomEnvironment, scene);

        // if not setting the envtext of the scene, we have to load the DDS module as well
        new EnvironmentHelper(
            {
                skyboxTexture: roomEnvironment,
                createGround: false,
                createSkybox: false,
            },
            scene
        );

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'ground' shape.
        const ground = MeshBuilder.CreateGround(
            "ground",
            { width: 20, height: 20 },
            scene
        );

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseColor = Color3.Green();

        // ground.material = groundMaterial;
        ground.position.y -= 0.25;

        const box = MeshBuilder.CreateBox("box");
        box.material = groundMaterial;
        box.visibility = 0.5;

        const cylinder = MeshBuilder.CreateCylinder("cyl");
        cylinder.visibility = 0.5;

        const warehouse = new Warehouse(
            this._entityManager,
            new YUKA.Vector3(),
            { capacity: 1000, water: 120, metal: 90, carbon: 50 }
        );
        console.log(warehouse);

        const vehicleMesh = MeshBuilder.CreateCylinder(
            "cone",
            { height: 0.5, diameterTop: 0, diameterBottom: 0.25 },
            scene
        );
        vehicleMesh.rotation.x = Math.PI * 0.5;
        vehicleMesh.bakeCurrentTransformIntoVertices();
        this._vehicleMesh = vehicleMesh;

        const vehicle = new Drone("drone", warehouse);
        vehicle.setRenderComponent(this._vehicleMesh, this._sync);

        this._entityManager.add(vehicle);
        //

        const build1 = new Building(
            this._entityManager,
            new YUKA.Vector3(5, 0, -6),
            { metal: 30, carbon: 20 }
        );
        build1.setRenderComponent(cylinder, this._sync);
        build1.init();

        //
        const solar = new SolarPanel();
        solar.energyGridRegulator.updateFrequency = 0.3;
        this._entityManager.add(solar);

        console.log(this._entityManager);
        //
        //  const ggg = new YUKA.Regulator(0.1);
        //
        scene.onBeforeRenderObservable.add(() => {
            const delta = this._time.update().getDelta();
            this._entityManager.update(delta);
            vehicle.currentTime += delta;
            vehicle.stateMachine.update();
            //  solar.update(delta);
            //   solar.currentTime += delta;
            /*
            if (ggg.ready()) {
                console.log("READY");
            }
*/
            //  console.log(delta);
            //   this._entityManager.update(delta); // YUKA world
            /*
    this._drones?.forEach((d) => {
        d.currentTime += delta;
        d.stateMachine.update();
    });
*/
            //center.rotation.copy(center.rotation.fromEuler(0, 0 + delta, 0));
            //   house.rotation = center.rotation;

            // YUKA world

            //  console.log(center.rotation);
        });

        //
        return scene;
    };
    //
    private _sync(entity: YUKA.GameEntity, renderComponent: TransformNode) {
        Matrix.FromValues(
            ...(entity.worldMatrix.elements as FlatMatrix4x4)
        ).decomposeToTransformNode(renderComponent);
    }
}

export default new EnergyTest();

export type Resource = {
    type: "water" | "carbon" | "metal";
};

export interface IWarehouse {
    capacity: number;
    water: number;
    carbon: number;
    metal: number;
}

export class Warehouse extends YUKA.GameEntity {
    entityManager: YUKA.EntityManager;
    position: YUKA.Vector3;
    props?: IWarehouse | undefined;
    constructor(
        entityManager: YUKA.EntityManager,
        position: YUKA.Vector3,
        props: IWarehouse
    ) {
        super();
        this.entityManager = entityManager;
        this.entityManager.add(this);

        this.position = position;
        this.props = props;

        this.props.capacity = 2000;
    }
}
//

interface IdeliverToBuild {
    metal?: number;
    carbon?: number;
}

export class Building extends YUKA.GameEntity {
    stateMachine: YUKA.StateMachine<YUKA.GameEntity>;
    entityManager: YUKA.EntityManager;
    position: YUKA.Vector3;
    deliverToBuild?: IdeliverToBuild;
    // props?: IWarehouse | undefined;
    constructor(
        entityManager: YUKA.EntityManager,
        position: YUKA.Vector3,
        deliverToBuild: IdeliverToBuild
    ) {
        super();
        this.entityManager = entityManager;
        this.entityManager.add(this);

        this.position = position;
        this.deliverToBuild = deliverToBuild;
        this.stateMachine = new YUKA.StateMachine(this);
        this.stateMachine.add(BEGINBUILD, new BeginBuildState());
        this.stateMachine.changeTo(BEGINBUILD);
    }

    init() {
        if (this.entityManager.getEntityByName("drone")) {
        }
        this.sendMessage(
            this.entityManager.getEntityByName("drone")!,
            "Demand",
            0,
            { data: this.deliverToBuild }
        );
    }
}

//
const IDLE = "IDLE";
const WALK = "WALK";
const WORK = "WORK";
const RETURNHOME = "RETURNHOME";
const BEGINBUILD = "BEGINBUILD";
const ZERO = new YUKA.Vector3();

export class Drone extends YUKA.Vehicle {
    stateMachine: YUKA.StateMachine<YUKA.Vehicle>;
    currentTime: number;
    maxSpeed: number;
    warehouse: YUKA.GameEntity;
    work: YUKA.GameEntity | undefined;
    mainBehavior: YUKA.SteeringBehavior;
    constructor(name: string, warehouse: YUKA.GameEntity) {
        super();

        this.name = name;
        this.warehouse = warehouse;
        this.currentTime = 0;
        this.maxSpeed = 5;
        this.stateMachine = new YUKA.StateMachine(this);
        this.stateMachine.add(IDLE, new IdleState());
        this.stateMachine.add(WALK, new WalkState());
        this.stateMachine.add(WORK, new WorkState());
        this.stateMachine.add(RETURNHOME, new ReturnState());
        this.stateMachine.changeTo(IDLE);

        const arriveBehavior = new YUKA.ArriveBehavior(
            new YUKA.Vector3(),
            2.5,
            0.1
        );
        arriveBehavior.active = false;

        this.steering.add(arriveBehavior);

        this.mainBehavior = arriveBehavior;

        console.log("created ", this);
    }
    //
    handleMessage(telegram: YUKA.Telegram): boolean {
        const message = telegram.message;

        console.log(telegram);

        switch (message) {
            case "Demand":
                console.log("DEMAND");
                (this.mainBehavior as YUKA.ArriveBehavior).target =
                    telegram.sender.position;
                return true;

            default:
                console.warn("Collectible: Unknown message.");
        }

        return false;
    }
    //
    /*
    update(delta: number) {
        this.currentTime += delta;

        this.stateMachine.update();

        return this;
    }
    */
}
//
//
class IdleState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER IDLE");
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        //  console.log(drone);
        if (drone.steering.behaviors[0]) {
            //   drone.steering.behaviors[0].active = false;
        }

        //
    }

    execute(drone: any) {
        //  console.log(drone.name);

        if (drone.currentTime > 5) {
            drone.stateMachine.changeTo(WALK);
        }
    }

    exit(drone: any) {}
}

class WalkState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER WALK");
        drone.currentTime = 0;
        //   drone.velocity = new YUKA.Vector3(0, 0, 0);

        drone.steering.behaviors[0].active = true;
        //        drone.steering.behaviors[0].target = drone.

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
            drone.stateMachine.changeTo(WORK);
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

class WorkState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER WorkState");
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        console.log(drone);
        if (drone.steering.behaviors[0]) {
            drone.steering.behaviors[0].active = false;
        }

        //
    }

    execute(drone: any) {
        //  console.log(drone.name);

        if (drone.currentTime > 5) {
            drone.stateMachine.changeTo(RETURNHOME);
        }
    }

    exit(drone: any) {}
}

class ReturnState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER ReturnState");
        drone.currentTime = 0;
        //   drone.velocity = new YUKA.Vector3(0, 0, 0);

        drone.steering.behaviors[0].active = true;
        drone.steering.behaviors[0].target = drone.warehouse.position;

        //
    }

    execute(drone: any) {
        //  console.log(drone.name);
        //   drone.steering.behaviors[0].target = drone.house.getWorldPosition();

        //   let ggg = drone.house.getWorldPosition(ZERO);
        //   drone.steering.behaviors[0].target = ggg;

        ///   console.log(ggg);
        const squaredDistance = drone.position.squaredDistanceTo(
            drone.steering.behaviors[0].target
        );
        if (squaredDistance < 0.25) {
            drone.currentTime = 0;
            drone.velocity = new YUKA.Vector3(0, 0, 0);
            drone.stateMachine.changeTo(IDLE);
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

class BeginBuildState extends YUKA.State<YUKA.Vehicle> {
    enter(owner: any) {
        console.log("ENTER BeginBuildState");
        // drone.velocity = new YUKA.Vector3(0, 0, 0);

        //
    }

    execute(owner: any) {
        //  console.log(drone.name);
        /*
        if (owner.currentTime > 5) {
            owner.stateMachine.changeTo(RETURNHOME);
        }
        */
    }

    exit(owner: any) {}
}

export class SolarPanel extends YUKA.GameEntity {
    energy: number = 10;
    needRepair: number = 100;
    energyGridRegulator: myRegulator;
    currentTime: number = 0;
    constructor() {
        super();
        this.energyGridRegulator = new myRegulator(0.2);

        console.log(this);
        console.log(this.energyGridRegulator.ready());
    }
    /*
        setInterval(() => {
            console.log(this.energyGridRegulator.ready());
        }, 1000);
    }
    */

    update(delta: number): this {
        super.update(delta);
        this.currentTime += delta;
        console.log((this.energyGridRegulator as any)._time._elapsed);
        if (
            (this.energyGridRegulator as any)._time._elapsed >=
            (this.energyGridRegulator as any)._time._nextUpdateTime
        ) {
            (this.energyGridRegulator as any)._nextUpdateTime =
                (this.energyGridRegulator as any)._time._elapsed +
                1 / (this.energyGridRegulator as any).updateFrequency;
            //  console.log((this.energyGridRegulator as any)._time._elapsed);
        }
        //  console.log(this);
        return this;
    }
}

export class myRegulator extends YUKA.Regulator {
    private _time: any;
    private _nextUpdateTime: any;

    constructor(updateFrequency = 0.3) {
        super();
    }
    /*
    ready(): boolean {
        // super.ready();
        this._time.update();
        const elapsedTime = this._time.getElapsed();
        if (elapsedTime >= this._nextUpdateTime) {
            this._nextUpdateTime = elapsedTime + 1 / this.updateFrequency;
            return true;
        } else {
            return false;
        }
    }
    */
}
