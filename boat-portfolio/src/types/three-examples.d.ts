declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import type { Loader, LoadingManager, Group } from 'three'

  export interface GLTF {
    scene: Group
  }

  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager)
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (error: unknown) => void
    ): void
  }
}
