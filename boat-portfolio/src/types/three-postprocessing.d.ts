declare module 'three/examples/jsm/postprocessing/EffectComposer' {
  import type { WebGLRenderer } from 'three'
  export class EffectComposer {
    constructor(renderer: WebGLRenderer)
    addPass(pass: unknown): void
    render(): void
    setSize(width: number, height: number): void
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
  import type { Camera, Scene } from 'three'
  export class RenderPass {
    constructor(scene: Scene, camera: Camera)
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
  import type { Vector2 } from 'three'
  export class UnrealBloomPass {
    constructor(resolution: Vector2, strength: number, radius: number, threshold: number)
  }
}

declare module 'three/examples/jsm/postprocessing/ShaderPass' {
  export class ShaderPass {
    uniforms: Record<string, { value: unknown }>
    constructor(shader: {
      uniforms: Record<string, { value: unknown }>
      vertexShader: string
      fragmentShader: string
    })
  }
}

declare module 'three/examples/jsm/postprocessing/BokehPass' {
  import type { Camera, Scene } from 'three'
  export class BokehPass {
    constructor(scene: Scene, camera: Camera, params?: { focus?: number; aperture?: number; maxblur?: number })
  }
}
