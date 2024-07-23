import { Document, WebIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
    dedup,
    prune,
    weld,
    reorder,
    simplify,
    quantize,
    flatten,
    join,
} from "@gltf-transform/functions";
import {
    MeshoptEncoder,
    MeshoptSimplifier,
    MeshoptDecoder,
} from "meshoptimizer";

onmessage = async (e) => {
    console.log("Message received from main script", e.data);
    // const workerResult = e.data * 3;

    const assetBlob = new Blob([e.data]);
    const assetUrl = URL.createObjectURL(assetBlob);

    let timer = Date.now();

    const io = new WebIO().registerExtensions(ALL_EXTENSIONS);
    /*
    .registerDependencies({
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
      
    });*/
    console.log(
        "WebIO created " +
            ((Date.now() - timer) * 0.001).toFixed(2) +
            " seconds"
    );
    const arr = new Uint8Array(e.data);
    const doc = await io.readBinary(arr);
    //   console.log(doc);
    console.log(
        "Doc created " + ((Date.now() - timer) * 0.001).toFixed(2) + " seconds"
    );
    await MeshoptEncoder.ready;
    //
    console.log(
        "MeshoptEncoder ready " +
            ((Date.now() - timer) * 0.001).toFixed(2) +
            " seconds"
    );
    //
    await doc.transform(
        dedup(),
        flatten(),
        join({ keepNamed: true }),
        prune(),
        weld({}),
        simplify({ simplifier: MeshoptSimplifier, error: 0.01 }),
        reorder({ encoder: MeshoptEncoder }),
        quantize()
    );

    //
    console.log(
        "The correction finished at " +
            ((Date.now() - timer) * 0.001).toFixed(2) +
            " seconds"
    );
    //
    console.log(doc.getRoot().listTextures())
    console.log(doc.getRoot().listMaterials())

    //
    const glb = await io.writeBinary(doc);

    const aBlob = new Blob([glb]);

    //  const workerResult =  new Blob([e.data]);
    console.log("Posting message back to main script");
    postMessage(aBlob);
};

/*
onmessage = ({ data: { question } }) => {
  console.log(question)
  self.postMessage({
    answer: 42,
  });
};
*/
