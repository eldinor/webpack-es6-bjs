import {
    AbstractMesh,
    AssetsManager,
    FilesInput,
    MeshAssetTask,
    ContainerAssetTask,
    AssetContainer,
    Scene,
    Color3,
    MeshExploder,
    ArcRotateCamera,
    FramingBehavior,
    Animation,
    Mesh,
    SimplificationType,
    BoundingInfo,
} from "@babylonjs/core";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GLTF2Export } from "@babylonjs/serializers/glTF";

import { Pane } from "tweakpane";

// import ColorThief from "colorthief";

import { createUploadButton } from "./createuiCONT";

export class NiceLoaderCONT {
    scene: Scene;
    arr: Array<ContainerAssetTask>;

    constructor(scene: Scene, arr: Array<ContainerAssetTask>) {
        this.scene = scene;
        this.arr = arr;

        createUploadButton();
        this.uploadModel(scene, arr);
    }

    uploadModel(scene: Scene, arr: Array<ContainerAssetTask>, pane?: Pane) {
        let assetsManager = new AssetsManager(scene);
        let root: any;
        let modelsArray = arr;

        const tempNodes = scene.getNodes(); // To store existing nodes and not export them later

        console.log("tempNodes", tempNodes);

        let sb = makeSimpButton(document.body);

        var duplicate = function (container: any, offset: any, offsetY: any) {
            let entries = container.instantiateModelsToScene(undefined, true, {
                doNotInstantiate: true,
            });

            for (var node of entries.rootNodes) {
                node.position.x += offset;
                node.position.y += offsetY;
            }
        };

        assetsManager.onTaskSuccessObservable.add(function (task: any) {
            root = task.loadedMeshes[0]; //will hold the mesh that has been loaded recently\
            root.name = task.name;

            console.log(task);

            task.loadedContainer.addAllToScene();

            modelsArray.push(task);

            const pane = new Pane();
            const PARAMS: any = {
                Meshes: scene.meshes.length.toFixed(),
                title: "hello",
                color: "#ff0055",
            };

            pane.addInput(PARAMS, "Meshes");
            pane.addInput(PARAMS, "title");
            pane.addInput(PARAMS, "color");

            sb!.onclick = () => {
                console.log("sb!");
                startSimplify(task.loadedContainer);
            };
            //

            // getCommonBound(root);
            //   duplicate(task.loadedContainer, 22, 0);
            /*
      const mClone = task.loadedContainer.instantiateModelsToScene(
        undefined,
        false,
        { doNotInstantiate: true }
      );

      console.log("mClone", mClone);
*/
            //   root.normalizeToUnitCube(true);
            //   root.scaling.scaleInPlace(10);

            console.log("task successful", task);
            task.loadedMeshes.forEach((element: any) => {
                element.checkCollisions = true;
            });
            // Enable camera's behaviors

            let camera = scene.activeCamera as ArcRotateCamera;

            camera.useFramingBehavior = true;
            //camera.radius = 1000;

            const framingBehavior = camera.getBehaviorByName(
                "Framing"
            ) as FramingBehavior;
            framingBehavior.framingTime = 0.2;
            framingBehavior.elevationReturnTime = -1;

            if (scene.meshes.length) {
                camera.lowerRadiusLimit = null;

                const worldExtends = scene.getWorldExtends(function (root) {
                    return root.isVisible && root.isEnabled();
                });
                framingBehavior.zoomOnBoundingInfo(
                    worldExtends.min,
                    worldExtends.max
                );
            }

            scene.debugLayer.show({
                overlay: true,
                embedMode: true,
                enablePopup: false,
            });
            scene.debugLayer.select(root);

            document.getElementById("deleteButton")!.style.display = "initial";
            document.getElementById("exportButton")!.style.display = "initial";

            document.getElementById("saveAll")!.style.display = "initial";
            document.getElementById("saveAllLabel")!.style.display = "initial";

            document.getElementById("loadFile")!.style.display = "none";
            //
            // analyzeModel(task);

            // explodeModel(task, scene);
        });
        //
        assetsManager.onTaskErrorObservable.add(function (task) {
            console.log(
                "task failed: " + task.name,
                task.errorObject.message,
                task.errorObject.exception
            );
        });

        const loadButton = document.getElementById("loadFile");

        loadButton!.onchange = function (evt) {
            let files: any = (evt.target as HTMLInputElement)!.files;
            let filename = files[0].name;
            let blob = new Blob([files[0]]);

            console.log(files[0].size);

            let sizeInMB = (files[0].size / (1024 * 1024)).toFixed(2);

            console.log(sizeInMB + " MB");

            //    document.getElementById("flieName")!.innerHTML = filename;
            //    document.getElementById("flieSize")!.innerHTML = sizeInMB + " MB";
            //   document.getElementById("fileInfo")!.style.display = "initial";

            FilesInput.FilesToLoad[filename.toLowerCase()] = blob as File;

            assetsManager.addContainerTask(filename, "", "file:", filename);
            assetsManager.load();
        };

        // DELETE ALL
        document.getElementById("deleteButton")!.onclick = function (_e) {
            modelsArray.forEach((element: ContainerAssetTask) => {
                console.log("element", element);

                element.loadedContainer.dispose();

                /*
        element.loadedMeshes.forEach((a) => {
          a.dispose();
        });
        element.loadedAnimationGroups.forEach((a) => {
          a.dispose();
        });

        element.loadedSkeletons.forEach((a) => {
          a.dispose();
        });

        */
            });

            modelsArray = [];

            (document.getElementById("loadFile") as HTMLInputElement).value =
                "";
            loadButton!.innerHTML = "";

            document.getElementById("deleteButton")!.style.display = "none";
            document.getElementById("exportButton")!.style.display = "none";

            document.getElementById("saveAll")!.style.display = "none";
            document.getElementById("saveAllLabel")!.style.display = "none";
            // To clear the deleted node
            scene.debugLayer.hide();
            scene.debugLayer.show({ embedMode: true });
            document.getElementById("loadFile")!.style.display = "initial";
            //   document.getElementById("fileInfo")!.style.display = "none";
        };

        // EXPORT
        document.getElementById("exportButton")!.onclick = function (_e) {
            let saveAll = (
                document.getElementById("saveAll") as HTMLInputElement
            ).checked;

            let options = {
                shouldExportNode: function (node: any) {
                    if (!saveAll) {
                        if (!(tempNodes as any).includes(node)) {
                            return node;
                        }
                    } else {
                        return node;
                    }
                },
            };

            console.log(modelsArray);

            let exportFileName = "";

            modelsArray.forEach((m) => {
                exportFileName += m.name.slice(0, 6) + "-";
            });

            exportFileName = "NL-" + exportFileName.slice(0, -1);

            console.log("EXPORT " + exportFileName);

            GLTF2Export.GLBAsync(scene, exportFileName, options).then((glb) => {
                glb.downloadFiles();
            });
        };
    }
}

function makeSimpButton(parent: HTMLElement) {
    let SimpButton = document.getElementById("SimpButton");
    if (!SimpButton) {
        SimpButton = document.createElement("button");
        SimpButton.setAttribute("id", "SimpButton");
        SimpButton.innerText = "makeSimpButton";
        // SimpButton.style.display = "none";

        SimpButton.style.border = "2px solid palevioletred";
        SimpButton.style.borderRadius = "5px";
        SimpButton.style.backgroundColor = "#7B1F07";
        SimpButton.style.color = "white";
        SimpButton.style.position = "absolute";
        SimpButton.style.top = "10px";
        SimpButton.style.left = "10px";

        parent.appendChild(SimpButton);

        return SimpButton;
    } else {
        return null;
    }
}

async function startSimplify(cont: AssetContainer) {
    let dLod1: number = 40;

    console.log("startSimplify", cont.meshes);

    console.log("startSimplify", [...(cont.meshes as any)]);

    let cloneOffset = getCommonBound(cont.meshes[0]);

    console.log(cloneOffset);

    console.log(cloneOffset.boundingBox.extendSize._x);

    const tempCont = duplicateContainer(
        cont,
        cloneOffset.boundingBox.maximumWorld._x * 2 + 0.2,
        0
    );

    console.log(tempCont);

    let arr = [...cont.meshes];

    console.log(arr);

    // arr.forEach((m) => {

    let counter: any = 0;

    let origVerts: any = 0;
    let vertsTotal: any = 0;

    for (let i = 0; i < arr.length; i++) {
        if ((arr[i] as Mesh).geometry)
            (arr[i] as Mesh).simplify(
                [{ distance: dLod1, quality: 0.5, optimizeMesh: true }],
                false,
                SimplificationType.QUADRATIC,
                function () {
                    // alert("simplification finished");
                    counter++;
                    //    console.log("simplified Mesh: ", arr[i]);
                    const decimatedMesh = (
                        arr[i] as Mesh
                    ).getLODLevelAtDistance(dLod1);
                    //   console.log("decimatedMesh", decimatedMesh);

                    console.log(
                        "Simplifying " +
                            arr[i].name +
                            " # " +
                            counter +
                            " from " +
                            (arr.length - 1) +
                            " total"
                    );
                    console.log(
                        "Orig verts: " +
                            arr[i].getTotalVertices() +
                            " Reduced: " +
                            decimatedMesh?.getTotalVertices()
                    );

                    arr[i].renderOverlay = true;

                    origVerts += arr[i].getTotalVertices();
                    vertsTotal += decimatedMesh?.getTotalVertices();
                    // (arr[i] as Mesh).isVisible = false;
                    if (counter === arr.length - 1) {
                        console.log("LAST");
                        console.log(
                            "Optimized from " +
                                origVerts +
                                " vertices to " +
                                vertsTotal
                        );
                        arr.forEach((m) => {
                            m.renderOverlay = false;
                        });
                    }
                }
            );
    }

    // });

    //

    console.log("DONE!!!");
    /*
    (cont.meshes[1] as Mesh).optimizeIndices(function () {
        (cont.meshes[1] as Mesh).simplify(
            [
                { distance: 250, quality: 0.8 },
                { distance: 300, quality: 0.5 },
                { distance: 400, quality: 0.3 },
                { distance: 500, quality: 0.1 },
            ],
            false,
            SimplificationType.QUADRATIC,
            function () {
                alert("simplification finished");
            }
        );
    });


    */
}

function duplicateContainer(container: any, offset: any, offsetY: any) {
    let entries = container.instantiateModelsToScene(undefined, true, {
        doNotInstantiate: true,
    });

    for (var node of entries.rootNodes) {
        node.position.x += offset;
        node.position.y += offsetY;
    }
    return entries;
}

function getCommonBound(parent: any) {
    let childMeshes = parent.getChildMeshes();

    let min = childMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
    let max = childMeshes[0].getBoundingInfo().boundingBox.maximumWorld;

    for (let i = 0; i < childMeshes.length; i++) {
        let meshMin = childMeshes[i].getBoundingInfo().boundingBox.minimumWorld;
        let meshMax = childMeshes[i].getBoundingInfo().boundingBox.maximumWorld;

        min = Vector3.Minimize(min, meshMin);
        max = Vector3.Maximize(max, meshMax);
    }
    const newBI = new BoundingInfo(min, max);
    parent.setBoundingInfo(newBI);

    parent.showBoundingBox = true;

    return newBI;
}
