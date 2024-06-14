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

export class DefaultSceneWithTexture implements CreateSceneClass {
    private _time: YUKA.Time = new YUKA.Time();
    private _entityManager = new YUKA.EntityManager();
    private _target!: YUKA.GameEntity;

    private _scene!: Scene;
    private _targetMesh!: Mesh;
    private _vehicleMesh!: Mesh;
    private _drones: Array<Drone> | undefined;

    createScene = async (
        engine: AbstractEngine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        this._scene = scene;
        this._drones = [];

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

        const vehicle = new Drone("drone");

        vehicle.setRenderComponent(this._vehicleMesh, this._sync);

        this._entityManager.add(vehicle);
        //

        const house = new House(
            this._entityManager,
            new YUKA.Vector3(-2, 0, 4)
        );
        vehicle.position.copy(house.position);
        vehicle.house = house;

        house.setRenderComponent(box, this._sync);
        //
        const work = new Workplace(
            this._entityManager,
            new YUKA.Vector3(3, 0, 5)
        );
        work.setRenderComponent(cylinder, this._sync);
        vehicle.work = work;
        //
        //
        const center = new YUKA.GameEntity();
        this._entityManager.add(center);
        center.children = [house];
        (house.parent as any) = center;

        center.position = new YUKA.Vector3();

        //

        this._drones?.push(vehicle);
        console.log(this._entityManager);
        console.log(this._drones);

        //
        let ddd = 0;
        //
        this._scene.onBeforeRenderObservable.add(() => {
            const delta = this._time.update().getDelta();
            //  console.log(delta);
            //   this._entityManager.update(delta); // YUKA world

            this._drones?.forEach((d) => {
                d.currentTime += delta;
                d.stateMachine.update();
            });
            //     house.position.z += 0.001;
            center.rotation.fromEuler(0, ddd, 0);
            ddd += 0.0001;

            //center.rotation.copy(center.rotation.fromEuler(0, 0 + delta, 0));
            //   house.rotation = center.rotation;

            this._entityManager.update(delta); // YUKA world

            //  console.log(center.rotation);
        });
        //

        const myGraph = YUKA.GraphUtils.createGridLayout(10, 10);

        console.log(myGraph);

        createGraphHelper(scene, myGraph, 0.1);

        const astar = new YUKA.AStar(myGraph, 1, 29);
        astar.search();

        console.log(astar.getPath());

        console.log(astar.getSearchTree());

        //    astar.getPath();

        //   createConvexRegionHelper(myGraph, scene);
        //
        return scene;
    };

    private _sync(entity: YUKA.GameEntity, renderComponent: TransformNode) {
        Matrix.FromValues(
            ...(entity.worldMatrix.elements as FlatMatrix4x4)
        ).decomposeToTransformNode(renderComponent);
    }
}

export default new DefaultSceneWithTexture();

const IDLE = "IDLE";
const WALK = "WALK";
const WORK = "WORK";
const RETURNHOME = "RETURNHOME";

export class House extends YUKA.GameEntity {
    entityManager: YUKA.EntityManager;
    position: YUKA.Vector3;
    constructor(entityManager: YUKA.EntityManager, position: YUKA.Vector3) {
        super();
        this.entityManager = entityManager;
        this.entityManager.add(this);

        this.position = position;
    }
}

export class Workplace extends YUKA.GameEntity {
    entityManager: YUKA.EntityManager;
    position: YUKA.Vector3;
    constructor(entityManager: YUKA.EntityManager, position: YUKA.Vector3) {
        super();
        this.entityManager = entityManager;
        this.entityManager.add(this);

        this.position = position;
    }
}

export class Drone extends YUKA.Vehicle {
    stateMachine: YUKA.StateMachine<YUKA.Vehicle>;
    currentTime: number;
    maxSpeed: number;
    house: YUKA.GameEntity | undefined;
    work: YUKA.GameEntity | undefined;
    constructor(name: string) {
        super();

        this.name = name;
        this.currentTime = 0;
        this.maxSpeed = 5;
        this.stateMachine = new YUKA.StateMachine(this);
        this.stateMachine.add(IDLE, new IdleState());
        this.stateMachine.add(WALK, new WalkState());
        this.stateMachine.add(WORK, new WorkState());
        this.stateMachine.add(RETURNHOME, new ReturnState());
        this.stateMachine.changeTo(IDLE);

        const arriveBehavior = new YUKA.ArriveBehavior(
            new YUKA.Vector3(3, 0, 5),
            2.5,
            0.1
        );
        arriveBehavior.active = false;
        this.steering.add(arriveBehavior);

        console.log(this);
    }
    /*
    update(delta: number) {
        this.currentTime += delta;

        this.stateMachine.update();

        return this;
    }
    */
}
//
class IdleState extends YUKA.State<YUKA.Vehicle> {
    enter(drone: any) {
        console.log("ENTER IDLE");
        // drone.velocity = new YUKA.Vector3(0, 0, 0);
        console.log(drone);
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
        drone.steering.behaviors[0].target = drone.work.position;

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
        drone.steering.behaviors[0].target = drone.house.position;

        //
    }

    execute(drone: any) {
        //  console.log(drone.name);
        //   drone.steering.behaviors[0].target = drone.house.getWorldPosition();

        let ggg = drone.house.getWorldPosition(ZERO);
        drone.steering.behaviors[0].target = ggg;

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

function createGraphHelper(
    scene: Nullable<Scene> | undefined,
    graph: {
        getNodes: (arg0: never[]) => void;
        getEdgesOfNode: (arg0: any, arg1: any[]) => void;
        getNode: (arg0: any) => any;
    },
    nodeSize = 1,
    nodeColor = "#4e84c4",
    edgeColor = "#ffffff"
) {
    let nodes: never[] = [];
    graph.getNodes(nodes);

    const parent = new TransformNode("nodes-parent", scene);

    for (let node of nodes) {
        const nodeMaterial = new StandardMaterial("node");
        nodeMaterial.emissiveColor = Color3.FromHexString(nodeColor);

        const nodeMesh = MeshBuilder.CreatePolyhedron(
            "node",
            {
                type: 3, // Icosahedron
                size: nodeSize,
            },
            scene
        );
        nodeMesh.parent = parent;
        nodeMesh.material = nodeMaterial;
        (nodeMesh as any).position = new Vector3(
            (node as any).position.x,
            (node as any).position.y,
            (node as any).position.z
        );

        // edges
        const edges: any[] = [];
        const lines = [];
        for (let node of nodes) {
            graph.getEdgesOfNode((node as any).index, edges);

            const position = [];
            for (let edge of edges) {
                const fromNode = graph.getNode(edge.from);
                const toNode = graph.getNode(edge.to);

                position.push(
                    new Vector3(
                        fromNode.position.x,
                        fromNode.position.y,
                        fromNode.position.z
                    )
                );
                position.push(
                    new Vector3(
                        toNode.position.x,
                        toNode.position.y,
                        toNode.position.z
                    )
                );
            }

            lines.push(position);
        }

        const pathHelper = MeshBuilder.CreateLineSystem(
            "path-helper",
            {
                lines,
                updatable: false,
            },
            scene
        );
        pathHelper.color = Color3.Green();
        pathHelper.parent = parent;
    }

    return parent;
}

export { createGraphHelper };

export function createConvexRegionHelper(
    navMesh: { regions: any },
    scene: any
) {
    const regions = navMesh.regions;

    const customMesh = new Mesh("custom", scene);
    const customMeshMaterial = new StandardMaterial("custom-mesh", scene);
    customMeshMaterial.emissiveColor = Color3.Random();

    customMesh.material = customMeshMaterial;

    const positions = [];
    const colors = [];

    for (let region of regions) {
        // one color for each convex region
        const color = Color3.Random();

        // count edges

        let edge = region.edge;
        const edges = [];

        do {
            edges.push(edge);
            edge = edge.next;
        } while (edge !== region.edge);

        // triangulate

        const triangleCount = edges.length - 2;

        for (let i = 1, l = triangleCount; i <= l; i++) {
            const v1 = edges[0].vertex;
            const v2 = edges[i + 0].vertex;
            const v3 = edges[i + 1].vertex;

            positions.push(v1.x, v1.y, v1.z);
            positions.push(v2.x, v2.y, v2.z);
            positions.push(v3.x, v3.y, v3.z);

            colors.push(color.r, color.g, color.b, 1);
            colors.push(color.r, color.g, color.b, 1);
            colors.push(color.r, color.g, color.b, 1);
        }
    }

    const indices = [];
    for (let i = 0; i < positions.length / 3; i++) {
        indices.push(i);
    }

    const normals: never[] = [];

    const vertexData = new VertexData();
    VertexData.ComputeNormals(positions, indices, normals);

    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.colors = colors;

    vertexData.applyToMesh(customMesh);

    var mat = new StandardMaterial("mat", scene);
    mat.backFaceCulling = false;
    customMesh.material = mat;

    return customMesh;
}
