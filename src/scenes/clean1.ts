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

export class Clean implements CreateSceneClass {
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

        const vehicle = new YUKA.Vehicle();

        vehicle.setRenderComponent(this._vehicleMesh, this._sync);

        this._entityManager.add(vehicle);

        const solar = new SolarPanel(
            "solar",
            this._entityManager,
            this.energyGridRegulator,
            this.energyGrid
        );
        this.energyGrid.push(solar);

        const ccenter = new ControlCenter("ccenter", this._entityManager);
        this.energyGrid.push(ccenter);

        console.log(this._entityManager);
        console.log(this.energyGrid);

        console.log(this.countEnergy(this.energyGrid));
        //

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

    countEnergy(energyGrid: any) {
        let totalEnergyBalance = 0;
        energyGrid.forEach((element: { energy: number }) => {
            totalEnergyBalance = totalEnergyBalance + element.energy;
        });
        return totalEnergyBalance;
    }
}

export default new Clean();

export class SolarPanel extends YUKA.GameEntity {
    name: string;
    entityManager: YUKA.EntityManager;
    energy: number = 10;
    needRepair: number = 100;
    energyGridRegulator: YUKA.Regulator;
    energyGrid: Array<any>;
    currentTime: number = 0;
    active: boolean = true;
    effectiveness: number = this.needRepair * 0.01;
    constructor(
        name: string,
        entityManager: YUKA.EntityManager,
        energyGridRegulator: YUKA.Regulator,
        energyGrid: Array<any>
    ) {
        super();
        this.name = name;
        this.entityManager = entityManager;
        this.entityManager.add(this);
        this.energyGridRegulator = new YUKA.Regulator(0.3);
        this.energyGrid = energyGrid;
    }

    update(delta: number): this {
        // super.update(delta);
        //  console.log(this.energyGridRegulator.ready());
        if (this.energyGridRegulator.ready()) {
            console.log("GGGGGGGGGGGGGGG");
            console.log(this.countEnergy(this.energyGrid));
            this.needRepair -= 0.1;
            this.effectiveness = this.needRepair * 0.01;
            this.energy = this.energy - this.effectiveness * 0.1;

            console.log(this);
        }
        return this;
    }
    countEnergy(energyGrid: any) {
        let totalEnergyBalance = 0;
        energyGrid.forEach((element: { energy: number }) => {
            totalEnergyBalance = totalEnergyBalance + element.energy;
        });
        return totalEnergyBalance;
    }
}

export class ControlCenter extends YUKA.GameEntity {
    name: string;
    entityManager: YUKA.EntityManager;
    energy: number = -5;
    needRepair: number = 100;
    //   energyGridRegulator: YUKA.Regulator;
    currentTime: number = 0;
    constructor(
        name: string,
        entityManager: YUKA.EntityManager
        // energyGridRegulator: YUKA.Regulator
    ) {
        super();
        this.name = name;
        this.entityManager = entityManager;
        this.entityManager.add(this);
    }
}
