declare module 'three/examples/jsm/objects/Water' {
  import type { Mesh, Texture, Vector3, Fog, BufferGeometry } from 'three'

  export interface WaterOptions {
    textureWidth?: number
    textureHeight?: number
    waterNormals?: Texture
    sunDirection?: Vector3
    sunColor?: number
    waterColor?: number
    distortionScale?: number
    fog?: boolean | Fog
  }

  export class Water extends Mesh {
    material: {
      uniforms: {
        time: { value: number }
      }
    }
    constructor(geometry: BufferGeometry, options?: WaterOptions)
  }
}
