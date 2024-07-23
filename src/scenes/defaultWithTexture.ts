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
import { Color3, Color4 } from "@babylonjs/core";
import { HemisphericLight } from "@babylonjs/core/Lights";

export class DefaultSceneWithTexture implements CreateSceneClass {
    createScene = async (
        engine: AbstractEngine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

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
        const sphere = CreateSphere(
            "sphere",
            { diameter: 2, segments: 32 },
            scene
        );

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape.
        const ground = CreateGround("ground", { width: 6, height: 6 }, scene);

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        // groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;
        ground.receiveShadows = true;

        const light = new HemisphericLight("light", new Vector3(0, 1, 0));
        light.intensity = 0.6;

        const averageColor = await get_average_rgb(
            "https://playground.babylonjs.com/textures/lava/lavatile.jpg"
        );

        console.log(averageColor);

        const redChannel = averageColor[0];
        console.log(redChannel);
        /*
        (ground.material as StandardMaterial).diffuseColor = new Color3(
            averageColor[0],
            averageColor[1],
            averageColor[2]
        );
        sphere.material = ground.material;
        */
        scene.clearColor = new Color4(
            averageColor[0] / 255,
            averageColor[1] / 255,
            averageColor[2] / 255,
            1
        );

        return scene;
    };
}

export default new DefaultSceneWithTexture();

export async function get_average_rgb(src: string): Promise<Uint8ClampedArray> {
    /* https://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript */
    return new Promise((resolve) => {
        let context = document.createElement("canvas").getContext("2d");
        context!.imageSmoothingEnabled = true;

        let img = new Image();
        img.src = src;
        img.crossOrigin = "";

        img.onload = () => {
            context!.drawImage(img, 0, 0, 1, 1);
            resolve(context!.getImageData(0, 0, 1, 1).data.slice(0, 3));
        };
    });
}
