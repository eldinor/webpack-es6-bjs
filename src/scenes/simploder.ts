import {
    AssetContainer,
    Mesh,
    Nullable,
    SceneLoader,
    Tools,
} from "@babylonjs/core";
//
import { WebIO, Logger, ImageUtils } from "@gltf-transform/core";
import { Document } from "@gltf-transform/core/dist/document";
import { Scene } from "@gltf-transform/core/dist/properties";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
    textureCompress,
    dedup,
    join,
    weld,
    prune,
    resample,
    instance,
    quantize,
    reorder,
    simplify,
    flatten,
    sparse,
} from "@gltf-transform/functions";

import {
    MeshoptEncoder,
    MeshoptSimplifier,
    MeshoptDecoder,
} from "meshoptimizer";

export interface ISimploderOptions {
    ratio?: number;
    error?: number;
    lockBorder?: boolean;
}

export class Simploder {
    // assetArrayBuffer: ArrayBuffer;

    options?: ISimploderOptions;
    io: WebIO | undefined;
    constructor(options?: ISimploderOptions) {
        //   this.options = options;
    }
    async load(url: string): Promise<ArrayBuffer> {
        const assetArrayBuffer = await Tools.LoadFileAsync(url, true);
        return Promise.resolve(assetArrayBuffer);
    }
    //#################
    async optimize(assetArrayBuffer: ArrayBuffer): Promise<Document> {
        const arr = new Uint8Array(assetArrayBuffer);
        console.log(arr);
        const io = new WebIO()
            .registerExtensions(ALL_EXTENSIONS)
            .registerDependencies({
                "meshopt.decoder": MeshoptDecoder,
                "meshopt.encoder": MeshoptEncoder,
            });
        const doc = await io.readBinary(arr);
        console.log(doc);
        this.io = io;

        await MeshoptEncoder.ready;
        //
        await doc.transform(
            dedup(),
            flatten(),
            join({ keepNamed: false }),
            prune(),
            weld({})
            //   simplify({ simplifier: MeshoptSimplifier, error: 0.01 })
            // reorder({ encoder: MeshoptEncoder }),
            // quantize()
        );

        return Promise.resolve(doc);
    }
    async textureCompress(doc: Document): Promise<Document> {
        await doc.transform(
            textureCompress({ targetFormat: "webp", resize: [512, 512] })
        );
        return Promise.resolve(doc);
    }

    async toBinaryArray(doc: Document): Promise<Uint8Array> {
        const glb = await (this.io as WebIO).writeBinary(doc);
        console.log(glb);
        return Promise.resolve(glb);
    }
    async loadFromBinary(arr: Uint8Array, scene: any): Promise<AssetContainer> {
        const aBlob = new Blob([arr]);
        const aUrl = URL.createObjectURL(aBlob);
        /*
        const container = await SceneLoader.ImportMeshAsync(
            "",
            aUrl,
            undefined,
            scene,
            undefined,
            ".glb"
        );
        */

        const container = await SceneLoader.LoadAssetContainerAsync(
            "",
            aUrl,
            scene,
            undefined,
            ".glb"
        );
        // container.addAllToScene();
        console.log(container);
        return Promise.resolve(container);
    }

    mergeAll(container: AssetContainer): Nullable<Mesh> {
        const merged = Mesh.MergeMeshes(
            container.meshes[0].getChildMeshes(),
            true,
            true,
            undefined,
            undefined,
            true
        );
        merged!.name = "_OptedModel";

        while (container.meshes.length) {
            console.log(container.meshes[0].name);
            container.meshes[0].dispose();
        }
        console.log(container);
        // container.dispose();
        return merged;
    }
}
