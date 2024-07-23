export class Simploder {
    assetArrayBuffer: ArrayBuffer;
    constructor(assetArrayBuffer: ArrayBuffer) {
        this.assetArrayBuffer = assetArrayBuffer;
        this.createWorker();
    }
    createWorker() {
        const worker = new Worker(new URL("./worker.js", import.meta.url));

        worker.postMessage(this.assetArrayBuffer);
        console.log("Message posted to worker");

        worker.onmessage = (e) => {
            console.log("Message received from worker", e.data);

            //   return worker;
        };
    }
}
