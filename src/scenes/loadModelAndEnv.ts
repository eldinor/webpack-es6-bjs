import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import {
    AbstractMesh,
    AssetsManager,
    FilesInput,
    MeshAssetTask,
    ContainerAssetTask,
    AssetContainer,
    Scene,
    Engine,
    Color3,
    MeshExploder,
    ArcRotateCamera,
    FramingBehavior,
    Animation,
    Mesh,
    SimplificationType,
    BoundingInfo,
    Tools,
    MeshBuilder,
} from "@babylonjs/core";
// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import { NiceLoaderVIEW } from "../simp/niceloaderVIEW";

export class DefaultSceneWithTexture implements CreateSceneClass {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        if (!scene.environmentTexture) {
            const hdrTexture = new CubeTexture(
                "https://playground.babylonjs.com/textures/environment.env",
                scene
            );
            hdrTexture.gammaSpace = false;
            scene.environmentTexture = hdrTexture;
        }

        const light = new HemisphericLight(
            "light1",
            new Vector3(0, 1, 0),
            scene
        );
        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;
        // Provide the array
        const modelsArray: any = [];

        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then((_values) => {
            // console.log(_values);
            /*
                  scene.debugLayer.show({
                      handleResize: true,
                      overlay: true,
                      embedMode: true,
                      globalRoot: document.getElementById("#root") || undefined,
                  });
                  */
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
        camera.attachControl(canvas, true);

        //  var box = MeshBuilder.CreateBox("box", {}, scene);

        camera.attachControl(canvas, true);
        camera.useFramingBehavior = true;
        // camera.setTarget(box);

        // This targets the camera to scene origin
        //   camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas

        new NiceLoaderVIEW(scene, modelsArray);

        return scene;
    };
}

export default new DefaultSceneWithTexture();
