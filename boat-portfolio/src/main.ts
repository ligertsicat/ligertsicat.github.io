import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Water } from 'three/examples/jsm/objects/Water'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

const islands = [
  {
    title: 'Product Design',
    role: 'Lead Designer',
    detail: 'Shipped a core product redesign that lifted retention.',
  },
  {
    title: 'Frontend',
    role: 'Senior Engineer',
    detail: 'Built a reusable component system for rapid launches.',
  },
  {
    title: 'Creative Dev',
    role: 'Freelance',
    detail: 'Crafted immersive web experiences for brands.',
  },
  {
    title: 'Systems',
    role: 'Platform',
    detail: 'Architected scalable infra with focus on reliability.',
  },
]

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="scene-root">
    <canvas id="scene"></canvas>
    <div class="hud">
      <div class="title">Boat Portfolio</div>
      <div class="subtitle">Rotate the world with left/right keys.</div>
      <div class="labels">
        ${islands
          .map(
            (item, index) => `
            <article class="island-card" data-index="${index}">
              <div class="card-title">${item.title}</div>
              <div class="card-role">${item.role}</div>
              <div class="card-detail">${item.detail}</div>
            </article>
          `
          )
          .join('')}
      </div>
      <div class="nav">
        ${islands.map((_, index) => `<button class="dot" data-index="${index}"></button>`).join('')}
      </div>
    </div>
  </div>
`

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0x0e1420, 10, 30)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 20)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.2,
  0.4,
  0.2
)
composer.addPass(bloomPass)


const loader = new GLTFLoader()

const ambient = new THREE.AmbientLight(0x8aa0c8, 0.45)
scene.add(ambient)

const warmAmbient = new THREE.AmbientLight(0xffc6a0, 0.12)
scene.add(warmAmbient)

const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
keyLight.position.set(4, 7, 3)
scene.add(keyLight)

const rimLight = new THREE.DirectionalLight(0x7ad1ff, 0.6)
rimLight.position.set(-6, 2, -3)
scene.add(rimLight)

const glowGeometry = new THREE.SphereGeometry(28, 48, 32)
const glowMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.BackSide,
  uniforms: {
    uGlowColor: { value: new THREE.Color(0x6fb7ff) },
  },
  vertexShader: `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uGlowColor;
    varying vec3 vPos;
    void main() {
      float horizon = smoothstep(-6.0, 6.0, vPos.y);
      float fade = smoothstep(0.2, 0.95, horizon);
      float strength = pow(1.0 - fade, 2.2);
      gl_FragColor = vec4(uGlowColor, strength * 0.35);
    }
  `,
})
const glow = new THREE.Mesh(glowGeometry, glowMaterial)
glow.position.y = -2
scene.add(glow)

const skyGeometry = new THREE.SphereGeometry(40, 32, 24)
const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    uTop: { value: new THREE.Color(0x0a1c2e) },
    uBottom: { value: new THREE.Color(0x650dd9) },
  },
  vertexShader: `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uTop;
    uniform vec3 uBottom;
    varying vec3 vPos;
    void main() {
      float h = smoothstep(-10.0, 18.0, vPos.y);
      vec3 color = mix(uBottom, uTop, h);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
})
const sky = new THREE.Mesh(skyGeometry, skyMaterial)
scene.add(sky)

const clouds = new THREE.Group()
scene.add(clouds)

const normalSize = 256
const normalData = new Uint8Array(normalSize * normalSize * 4)
const heightField = new Float32Array(normalSize * normalSize)
const rand = (x: number, y: number) => {
  return (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1
}
const noise = (x: number, y: number) => {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const a = rand(xi, yi)
  const b = rand(xi + 1, yi)
  const c = rand(xi, yi + 1)
  const d = rand(xi + 1, yi + 1)
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}
for (let y = 0; y < normalSize; y += 1) {
  for (let x = 0; x < normalSize; x += 1) {
    const nx = x / normalSize
    const ny = y / normalSize
    const h =
      noise(nx * 6, ny * 6) * 0.6 +
      noise(nx * 18, ny * 18) * 0.3 +
      noise(nx * 42, ny * 42) * 0.1
    heightField[y * normalSize + x] = h
  }
}
for (let y = 0; y < normalSize; y += 1) {
  for (let x = 0; x < normalSize; x += 1) {
    const left = heightField[y * normalSize + ((x - 1 + normalSize) % normalSize)]
    const right = heightField[y * normalSize + ((x + 1) % normalSize)]
    const down = heightField[((y - 1 + normalSize) % normalSize) * normalSize + x]
    const up = heightField[((y + 1) % normalSize) * normalSize + x]
    const dx = (right - left) * 1.4
    const dy = (up - down) * 1.4
    const invLen = 1 / Math.sqrt(dx * dx + dy * dy + 1)
    const nx = dx * invLen
    const ny = dy * invLen
    const nz = 1 * invLen
    const i = (y * normalSize + x) * 4
    normalData[i] = Math.floor((nx * 0.5 + 0.5) * 255)
    normalData[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255)
    normalData[i + 2] = Math.floor(nz * 255)
    normalData[i + 3] = 255
  }
}
const normalTexture = new THREE.DataTexture(normalData, normalSize, normalSize, THREE.RGBAFormat)
normalTexture.wrapS = THREE.RepeatWrapping
normalTexture.wrapT = THREE.RepeatWrapping
normalTexture.needsUpdate = true

const waterGeometry = new THREE.PlaneGeometry(60, 60, 1, 1)
const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: normalTexture,
  sunDirection: new THREE.Vector3(1, 1, 0).normalize(),
  sunColor: 0xffffff,
  waterColor: 0x0084ff,
  distortionScale: 1,
  fog: scene.fog !== undefined,
})
water.rotation.x = -Math.PI / 2
water.position.y = -1.8
scene.add(water)

const world = new THREE.Group()
scene.add(world)

const islandRadius = 10
const islandAngles = islands.map((_, index) => (index / islands.length) * Math.PI * 2)
const islandMeshes: THREE.Group[] = []

islandAngles.forEach((angle) => {
  const island = new THREE.Group()
  island.position.set(Math.sin(angle) * islandRadius, 0, Math.cos(angle) * islandRadius)
  world.add(island)
  islandMeshes.push(island)
})

const islandUrl = new URL('./fantasy_island.glb', import.meta.url).toString()
loader.load(
  islandUrl,
  (gltf: GLTF) => {
    islandMeshes.forEach((island) => {
      const model = gltf.scene.clone(true)
      model.scale.set(0.03, 0.03, 0.03)
      model.position.set(0, -1.4, 0)
      island.add(model)
    })
  },
  undefined,
  (error: unknown) => {
    console.error('Failed to load island model', error)
  }
)

const cloudUrl = new URL('./Cloud_1.gltf', import.meta.url).toString()
loader.load(
  cloudUrl,
  (gltf: GLTF) => {
    for (let i = 0; i < 6; i += 1) {
      const model = gltf.scene.clone(true)
      const scale = 0.8 + Math.random() * 0.6
      model.scale.set(scale, scale, scale)
      model.position.set((Math.random() - 0.5) * 18, 4 + Math.random() * 3, -12 + Math.random() * 8)
      model.rotation.y = (Math.random() - 0.5) * 0.6
      clouds.add(model)
    }
  },
  undefined,
  (error: unknown) => {
    console.error('Failed to load cloud model', error)
  }
)

const boat = new THREE.Group()
boat.position.set(0, 0, 13)
scene.add(boat)

const makeParticleField = (count: number, size: number, color: number, opacity: number) => {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const idx = i*3
    positions[idx] = (Math.random() - 0.5) * 0.6
    positions[idx + 1] = -0.6 + Math.random() * 0.3
    positions[idx + 2] = -20
    velocities[idx] = (Math.random() - 0.5) * 0.02
    velocities[idx + 1] = 0.01 + Math.random() * 0.03
    velocities[idx + 2] = -0.08 - Math.random() * 0.08
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  return { points, positions, velocities }
}

const mist = makeParticleField(220, 0.14, 0x9dd6ff, 0.25)
mist.points.position.set(0, 0, 0)
mist.points.rotation.y = Math.PI / 2
boat.add(mist.points)

const spray = makeParticleField(120, 0.08, 0xffffff, 0.5)
spray.points.position.set(0, 0.05, 0)
spray.points.rotation.y = Math.PI / 2
boat.add(spray.points)

const boatUrl = new URL('./BoatWSail.glb', import.meta.url).toString()
loader.load(
  boatUrl,
  (gltf: GLTF) => {
    const model = gltf.scene
    model.scale.set(0.9, 0.9, 0.9)
    model.rotation.y = Math.PI / 2
    model.position.set(0, -0.6, 0)
    boat.add(model)
  },
  undefined,
  (error: unknown) => {
    console.error('Failed to load boat model', error)
  }
)


const stars: THREE.Points[] = []
for (let i = 0; i < 4; i += 1) {
  const starGeo = new THREE.BufferGeometry()
  const starCount = 220
  const positions = new Float32Array(starCount * 3)
  const twinkle = new Float32Array(starCount)
  for (let j = 0; j < starCount; j += 1) {
    const radius = 14 + Math.random() * 6
    const theta = Math.random() * Math.PI * 2
    const y = 2 + Math.random() * 8
    positions[j * 3] = Math.cos(theta) * radius
    positions[j * 3 + 1] = y
    positions[j * 3 + 2] = Math.sin(theta) * radius
    twinkle[j] = Math.random()
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starGeo.setAttribute('twinkle', new THREE.BufferAttribute(twinkle, 1))
  const starMat = new THREE.PointsMaterial({
    color: 0xe6f4ff,
    size: 0.14 - i * 0.012,
    transparent: true,
    opacity: 0.95 - i * 0.1,
  })
  const starField = new THREE.Points(starGeo, starMat)
  scene.add(starField)
  stars.push(starField)
}

let targetX = 0
let targetY = 0
window.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1
  const y = (event.clientY / window.innerHeight) * 2 - 1
  targetX = x * 0.6
  targetY = y * 0.35
})

let activeIndex = 0
const cards = Array.from(document.querySelectorAll<HTMLDivElement>('.island-card'))
const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('.dot'))

const setActiveIndex = (index: number) => {
  activeIndex = (index + islands.length) % islands.length
  cards.forEach((card) => {
    card.classList.toggle('is-active', Number(card.dataset.index) === activeIndex)
  })
  dots.forEach((dot) => {
    dot.classList.toggle('is-active', Number(dot.dataset.index) === activeIndex)
  })
}

setActiveIndex(0)

dots.forEach((dot) => {
  dot.addEventListener('click', () => {
    setActiveIndex(Number(dot.dataset.index))
    targetRotation = nearestTargetRotation(worldRotation, -islandAngles[activeIndex])
    snapping = true
  })
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    setActiveIndex(activeIndex + 1)
    targetRotation = nearestTargetRotation(worldRotation, -islandAngles[activeIndex])
    snapping = true
  }
  if (event.key === 'ArrowLeft') {
    setActiveIndex(activeIndex - 1)
    targetRotation = nearestTargetRotation(worldRotation, -islandAngles[activeIndex])
    snapping = true
  }
})

let worldRotation = 0
let targetRotation = 0
let snapping = false
const TAU = Math.PI * 2
let wheelLock = false

const nearestTargetRotation = (current: number, target: number) => {
  let delta = ((target - current + Math.PI) % TAU) - Math.PI
  if (delta < -Math.PI) delta += TAU
  return current + delta
}

window.addEventListener(
  'wheel',
  (event) => {
    if (wheelLock) return
    wheelLock = true
    setTimeout(() => {
      wheelLock = false
    }, 260)
    if (Math.abs(event.deltaY) < 4) return
    if (event.deltaY > 0) {
      setActiveIndex(activeIndex + 1)
    } else {
      setActiveIndex(activeIndex - 1)
    }
    targetRotation = nearestTargetRotation(worldRotation, -islandAngles[activeIndex])
    snapping = true
  },
  { passive: true }
)

const clock = new THREE.Clock()
const labelAnchor = new THREE.Vector3()
const labelScreen = new THREE.Vector3()
const animate = () => {
  const elapsed = clock.getElapsedTime()
  boat.position.y = -1.1 + Math.sin(elapsed * 1.6) * 0.08
  boat.rotation.z = Math.sin(elapsed * 1.2) * 0.03
  water.material.uniforms.time.value = elapsed
  clouds.children.forEach((child, index) => {
    child.position.x += 0.002 + index * 0.0002
    if (child.position.x > 10) {
      child.position.x = -10
    }
  })
  const updateParticles = (field: { positions: Float32Array; velocities: Float32Array }) => {
    const { positions, velocities } = field
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i]
      positions[i + 1] += velocities[i + 1]
      positions[i + 2] += velocities[i + 2]
      if (positions[i + 2] < -6 || positions[i + 1] > 0.8) {
        positions[i] = (Math.random() - 0.5) * 0.6
        positions[i + 1] = -0.6 + Math.random() * 0.3
        positions[i + 2] = -3 + Math.random() * -1.2
      }
    }
  }
  // TODO
  // updateParticles(mist)
  // updateParticles(spray)
  ;(mist.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  ;(spray.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true

  camera.position.x += (targetX - camera.position.x) * 0.04
  camera.position.y += (0.5 - targetY - camera.position.y) * 0.04
  camera.lookAt(0, 0.3, 0)

  stars.forEach((field, index) => {
    field.rotation.y = elapsed * 0.02 * (index + 1)
    const base = 0.85 - index * 0.06
    field.material.opacity = base + Math.sin(elapsed * (0.6 + index * 0.15)) * 0.06
  })

  if (snapping) {
    worldRotation += (targetRotation - worldRotation) * 0.06
    if (Math.abs(targetRotation - worldRotation) < 0.001) {
      snapping = false
    }
  } else {
    worldRotation += (targetRotation - worldRotation) * 0.04
  }
  const sway = Math.sin(elapsed * 0.6) * 0.03
  world.rotation.y = worldRotation + sway

  islandMeshes.forEach((island, index) => {
    island.position.y = -0.45 +Math.sin(elapsed * 1.4 + index) * 0.05
  })

  const width = renderer.domElement.clientWidth
  const height = renderer.domElement.clientHeight
  islandMeshes.forEach((island, index) => {
    const card = cards[index]
    if (!card) return
    if (index !== activeIndex) {
      card.style.opacity = '0.15'
    }
    island.getWorldPosition(labelAnchor)
    labelAnchor.y += 1.8
    labelScreen.copy(labelAnchor).project(camera)
    const isVisible = labelScreen.z > -1 && labelScreen.z < 1
    if (!isVisible) {
      card.style.opacity = '0'
      return
    }
    const x = (labelScreen.x * 0.5 + 0.5) * width
    const y = (-labelScreen.y * 0.5 + 0.5) * height
    if (index === activeIndex) {
      card.style.opacity = '1'
    }
    card.style.transform = `translate(-50%, -110%) translate(${x}px, ${y}px)`
  })

  composer.render()
  requestAnimationFrame(animate)
}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.setSize(window.innerWidth, window.innerHeight)
})
