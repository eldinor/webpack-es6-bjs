import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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
import { HemisphericLight } from "@babylonjs/core";
import { Simploder } from "./simploder";

import "@babylonjs/loaders";

export class DefaultSceneWithTexture implements CreateSceneClass {
    createScene = async (
        engine: AbstractEngine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        // Uncomment to load the inspector (debugging) asynchronously

        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then((_values) => {
            //   console.log(_values);
            scene.debugLayer.show({
                handleResize: true,
                overlay: true,
                globalRoot: document.getElementById("#root") || undefined,
            });
        });

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

        // Our built-in 'ground' shape.
        const ground = CreateGround("ground", { width: 6, height: 6 }, scene);

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;
        ground.receiveShadows = true;

        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );
        light.intensity = 0.5;
        //
        //
        const simploder = new Simploder();
        console.log(simploder);
        //
        const loaded = await simploder.load(
            "https://raw.githubusercontent.com/eldinor/ForBJS/master/alien_probe.glb"
        );

        console.log(loaded);
        const optimized = await simploder.optimize(loaded);
        //
        console.log("optimized ", optimized);
        console.log(simploder.toBinaryArray(optimized));
        //
        //  const compressed = await simploder.textureCompress(optimized);
        //
        //  console.log(compressed);

        //  const toBinary = await simploder.toBinaryArray(compressed);
        const toBinary = await simploder.toBinaryArray(optimized);

        console.log(toBinary);
        const container = await simploder.loadFromBinary(toBinary, scene);
        //
        const mergedOpt = simploder.mergeAll(container);

        console.log(mergedOpt);
        //
        //  container.addAllToScene();
        //  container.dispose();
        //
        //
        return scene;
    };
}

export default new DefaultSceneWithTexture();
