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
import { AutoReleaseWorkerPool } from "@babylonjs/core/Misc/workerPool";

export class DefaultSceneWithTexture implements CreateSceneClass {
    public static _WorkerPoolPromise?: Promise<AutoReleaseWorkerPool>;
    public static WorkerPool?: AutoReleaseWorkerPool;

    public static DefaultNumWorkers = this.GetDefaultNumWorkers();

    private static GetDefaultNumWorkers(): number {
        if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
            return 1;
        }

        // Use 50% of the available logical processors but capped at 4.
        return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
    }

    //

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
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;
        ground.receiveShadows = true;

        const light = new DirectionalLight(
            "light",
            new Vector3(0, -1, 1),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;

        const shadowGenerator = new ShadowGenerator(512, light);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        shadowGenerator.setDarkness(0.2);

        shadowGenerator.getShadowMap()!.renderList!.push(sphere);
        //
        // const arwp = new AutoReleaseWorkerPool(4)
        //
        //
        DefaultSceneWithTexture._WorkerPoolPromise = new Promise((resolve) => {
            //  const workerContent = `${applyConfig}(${workerFunction})()`;
            const workerContent = `(${workerFunction})()`;
            //    console.log(workerContent);
            const workerBlobUrl = URL.createObjectURL(
                new Blob([workerContent], { type: "application/javascript" })
            );
            resolve(
                new AutoReleaseWorkerPool(4, () =>
                    initializeWebWorker(new Worker(workerBlobUrl))
                )
            );
        });

        console.log(DefaultSceneWithTexture._WorkerPoolPromise);

        const buffer = new ArrayBuffer(12);
        const x = new DataView(buffer);
        //
        await _uploadAsync(x);
        //

        return scene;
    };
}

export function initializeWebWorker(worker: Worker): Promise<Worker> {
    return new Promise((resolve, reject) => {
        const onError = (error: ErrorEvent) => {
            worker.removeEventListener("error", onError);
            worker.removeEventListener("message", onMessage);
            reject(error);
        };

        const onMessage = (message: MessageEvent) => {
            if (message.data.action === "init") {
                worker.removeEventListener("error", onError);
                worker.removeEventListener("message", onMessage);

                resolve(worker);
            }
        };

        worker.addEventListener("error", onError);
        worker.addEventListener("message", onMessage);

        worker.postMessage({
            action: "init",
        });
    });
}
//

export function workerFunction(KTX2DecoderModule?: any): void {
    onmessage = (event) => {
        console.log("MESSAGE GOT", event);
        if (!event.data) {
            return;
        }
        //  console.log(event.data.action);
        // console.log(event.data.options);
        switch (event.data.action) {
            case "init":
                {
                    console.log("WORKER CASE INIT");
                }
                break;
            case "decode":
                postMessage({
                    action: "decoded",
                    success: true,
                    decodedData: "weryui weroijuwer",
                });
                console.log("WORKER CASE DECODED");

                break;
        }
    };
}

export default new DefaultSceneWithTexture();

//
export function _uploadAsync(
    data: ArrayBufferView,
    options?: any
): Promise<void> {
    if (DefaultSceneWithTexture._WorkerPoolPromise) {
        return DefaultSceneWithTexture._WorkerPoolPromise.then((workerPool) => {
            return new Promise((resolve, reject) => {
                workerPool.push((worker, onComplete) => {
                    const onError = (error: ErrorEvent) => {
                        worker.removeEventListener("error", onError);
                        worker.removeEventListener("message", onMessage);
                        reject(error);
                        console.log(error);
                        onComplete();
                    };

                    const onMessage = (message: MessageEvent) => {
                        console.log(message);
                        if (message.data.action === "decoded") {
                            console.log(data);
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            if (!message.data.success) {
                                console.log(message);
                                reject({ message: message.data.msg });
                            } else {
                                try {
                                    console.log(message.data.decodedData);
                                    resolve();
                                } catch (err) {
                                    console.log({ message: err });
                                    reject({ message: err });
                                }
                            }
                            onComplete();
                        }
                    };

                    worker.addEventListener("error", onError);
                    worker.addEventListener("message", onMessage);
                    worker.postMessage({
                        action: "decode",
                        options: { key: "asdlkasd" },
                    });
                    console.log("POSTED DECODE");
                    const dataCopy = new Uint8Array(data.byteLength);
                    dataCopy.set(
                        new Uint8Array(
                            data.buffer,
                            data.byteOffset,
                            data.byteLength
                        )
                    );

                    worker.postMessage(
                        { action: "decode", data: dataCopy, options },
                        [dataCopy.buffer]
                    );
                });
            });
        });
    }

    throw new Error("KTX2 decoder module is not available");
}
//
