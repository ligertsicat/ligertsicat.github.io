declare module 'three/examples/jsm/objects/Sky' {
  import type { Mesh, ShaderMaterial } from 'three'

  export class Sky extends Mesh {
    material: ShaderMaterial & {
      uniforms: Record<string, { value: unknown }>
    }
  }
}
