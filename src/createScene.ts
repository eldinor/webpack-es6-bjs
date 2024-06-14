import type { Scene } from "@babylonjs/core/scene";

// Change this import to check other scenes
import { DefaultSceneWithTexture } from "./scenes/defaultWithTexture";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

import { LoadModelAndEnvScene } from "./scenes/loadModelAndEnv";

import { EnergyTest } from "./scenes/navigationMeshRecast";
import { Clean3 } from "./scenes/clean3";

import { GoalScene } from "./scenes/goal";

export interface CreateSceneClass {
    createScene: (
        engine: AbstractEngine,
        canvas: HTMLCanvasElement
    ) => Promise<Scene>;
    preTasks?: Promise<unknown>[];
}

export interface CreateSceneModule {
    default: CreateSceneClass;
}

export const getSceneModule = (): CreateSceneClass => {
    //  return new DefaultSceneWithTexture();
    return new GoalScene();
};
