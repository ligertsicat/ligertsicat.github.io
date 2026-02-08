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
    title: 'Robinhood',
    role: 'Software Engineer',
    detail: `
      <ul>
    <li>Cut market‑data latency 150ms → <10ms for millions by removing Redis/Kafka SPOFs and cutting infra costs 70%+.</li>
    <li>Built a 2M msg/sec WebSocket streaming system with single-digit millisecond latency.</li>
    <li>Drove infra and performance optimization across DBs, Kafka, K8s, and caching, saving $400K+/year while improving reliability.</li>
    </ul>
  `,
  },
  {
    title: 'Xendit',
    role: 'Senior Software Engineer',
    detail: `
      <ul>
        <li>Designed Golang payment microservices processing millions of transactions/day with 99.9% uptime.</li>
        <li>Built refund infrastructure to handle complex payment scenarios efficiently.</li>
        <li>Mentored engineers and raised platform standards across reliability and performance.</li>
      </ul>
  `,
  },
  {
    title: 'Metro East Technology Resources',
    role: 'Software Engineer',
    detail: `
      <ul>
        <li>Built fault-tolerant Golang telecom backend systems supporting thousands of concurrent users.</li>
        <li>Led AWS migration in 6 months, improving scalability and reliability.</li>
        <li>Established CI/CD pipelines with Jenkins, Docker, and Kubernetes.</li>
      </ul>
  `,
  },
  {
    title: 'How I Build',
    role: 'I build systems where milliseconds, scale, and reliability all matter.',
    detail: `
      <ul>
        <li>Design low-latency, real-time systems with clear performance budgets and measurable goals.</li>
        <li>Favor simple, resilient architectures that eliminate single points of failure.</li>
        <li>Optimize holistically. Correctness first, then performance, then cost.</li>
        <li>Treat observability, testing, and rollout safety as core features, not afterthoughts.</li>
      </ul>
  `,
  },
]

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="scene-root">
    <canvas id="scene"></canvas>
    <header class="topbar">
      <div class="topbar-left">
        <div class="title">Lee Sicat</div>
        <div class="headline">Software Engineer building low-latency, high-scale distributed systems</div>
      </div>
      <div class="topbar-right">
        <div class="hint">Explore with left/right keys or drag to scroll.</div>
        <div class="contact-inline">
          <span>Contact Info: linkedin.com/in/ligertsicat</span>
        </div>
      </div>
    </header>
    <div class="hud">
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
    <button class="nav-arrow nav-arrow-left" aria-label="Previous island">‹</button>
    <button class="nav-arrow nav-arrow-right" aria-label="Next island">›</button>
  </div>
`

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0x0e1420, 10, 70)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 19)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.1,
  0.4,
  0.2
)
composer.addPass(bloomPass)

const loader = new GLTFLoader()

const ambient = new THREE.AmbientLight(0x8aa0c8, 0.7)
scene.add(ambient)

const warmAmbient = new THREE.AmbientLight(0xffc6a0, 0.5)
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

const fogCanvas = document.createElement('canvas')
fogCanvas.width = 256
fogCanvas.height = 256
const fogCtx = fogCanvas.getContext('2d')
if (fogCtx) {
  fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height)
  for (let i = 0; i < 8; i += 1) {
    const x = 40 + Math.random() * 170
    const y = 40 + Math.random() * 170
    const r = 40 + Math.random() * 60
    const g = fogCtx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.18)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    fogCtx.fillStyle = g
    fogCtx.beginPath()
    fogCtx.arc(x, y, r, 0, Math.PI * 2)
    fogCtx.fill()
  }
}
const fogTexture = new THREE.CanvasTexture(fogCanvas)
fogTexture.wrapS = THREE.RepeatWrapping
fogTexture.wrapT = THREE.RepeatWrapping
fogTexture.repeat.set(2, 2)
const fogMaterial = new THREE.MeshBasicMaterial({
  map: fogTexture,
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
})
const fogLayer = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), fogMaterial)
fogLayer.rotation.x = -Math.PI / 2
fogLayer.position.set(0, -0.3, 6)
scene.add(fogLayer)

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

const islandUrls = [
  new URL('./islands1.glb', import.meta.url).toString(),
  new URL('./islands2.glb', import.meta.url).toString(),
  new URL('./islands3.glb', import.meta.url).toString(),
  new URL('./islands4.glb', import.meta.url).toString(),
]

islandMeshes.forEach((island, index) => {
  const url = islandUrls[index % islandUrls.length]
  loader.load(
    url,
    (gltf: GLTF) => {
      const model = gltf.scene
      model.scale.set(0.03, 0.03, 0.03)
      model.position.set(0, -1.2, 0)
      island.add(model)
    },
    undefined,
    (error: unknown) => {
      console.error('Failed to load island model', error)
    }
  )
})

const cloudUrl = new URL('./clouds.glb', import.meta.url).toString()
loader.load(
  cloudUrl,
  (gltf: GLTF) => {
    for (let i = 0; i < 20; i += 1) {
      const model = gltf.scene.clone(true)
      model.traverse((child) => {
        if ('material' in child) {
          const mesh = child as THREE.Mesh
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((material) => {
            material.transparent = true
            material.opacity = 0.2
            material.depthWrite = false
          })
        }
      })
      const scale = 0 + Math.random() * 0.6
      model.scale.set(scale, scale, scale)
      model.position.set(-35 + Math.random() * 70, 5 + Math.random() * 3, -10 + Math.random() * 8)
      model.rotation.y = (Math.random() - 0.5) * 0.6
      model.rotation.x = (Math.random() - 0.5) * 0.6
      model.rotation.z = (Math.random() - 0.5) * 0.6
      clouds.add(model)
    }
  },
  undefined,
  (error: unknown) => {
    console.error('Failed to load cloud model', error)
  }
)

const boat = new THREE.Group()
boat.position.set(0, 0, 14)
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
    model.scale.set(1.4, 1.4, 1.4)
    model.rotation.y = Math.PI / 2
    model.position.set(0, -0.7, 0)
    boat.add(model)
  },
  undefined,
  (error: unknown) => {
    console.error('Failed to load boat model', error)
  }
)


const stars: THREE.Points[] = []
const starCanvas = document.createElement('canvas')
starCanvas.width = 64
starCanvas.height = 64
const starCtx = starCanvas.getContext('2d')
if (starCtx) {
  const gradient = starCtx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  starCtx.fillStyle = gradient
  starCtx.beginPath()
  starCtx.arc(32, 32, 32, 0, Math.PI * 2)
  starCtx.fill()
}
const starTexture = new THREE.CanvasTexture(starCanvas)

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
    map: starTexture,
    alphaTest: 0.2,
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
const arrowLeft = document.querySelector<HTMLButtonElement>('.nav-arrow-left')
const arrowRight = document.querySelector<HTMLButtonElement>('.nav-arrow-right')

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

const shortestAngle = (a: number, b: number) => {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b))
}

const updateActiveFromRotation = () => {
  let closestIndex = 0
  let closestDistance = Infinity
  islandAngles.forEach((angle, index) => {
    const target = -angle
    const delta = Math.abs(shortestAngle(worldRotation, target))
    if (delta < closestDistance) {
      closestDistance = delta
      closestIndex = index
    }
  })
  if (closestIndex !== activeIndex) {
    setActiveIndex(closestIndex)
  }
}

dots.forEach((dot) => {
  dot.addEventListener('click', () => {
    setActiveIndex(Number(dot.dataset.index))
    targetRotation = nearestTargetRotation(worldRotation, -islandAngles[activeIndex])
    snapping = true
  })
})

const stepRight = () => {
  targetRotation = worldRotation - rotationStep
  snapping = true
}

const stepLeft = () => {
  targetRotation = worldRotation + rotationStep
  snapping = true
}

let holdLeft = false
let holdRight = false
const holdSpeed = 0.012

const startHoldLeft = () => {
  holdLeft = true
  holdRight = false
  snapping = false
}

const startHoldRight = () => {
  holdRight = true
  holdLeft = false
  snapping = false
}

const stopHold = () => {
  holdLeft = false
  holdRight = false
}

arrowRight?.addEventListener('click', stepRight)
arrowLeft?.addEventListener('click', stepLeft)
arrowRight?.addEventListener('pointerdown', startHoldRight)
arrowLeft?.addEventListener('pointerdown', startHoldLeft)
arrowRight?.addEventListener('pointerup', stopHold)
arrowLeft?.addEventListener('pointerup', stopHold)
arrowRight?.addEventListener('pointerleave', stopHold)
arrowLeft?.addEventListener('pointerleave', stopHold)

let worldRotation = 0
let targetRotation = 0
let snapping = false
const TAU = Math.PI * 2
let wheelLock = false
const rotationStep = (TAU / islands.length) * 0.5
let isDragging = false
let dragLastX = 0

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
      targetRotation = worldRotation + rotationStep
    } else {
      targetRotation = worldRotation - rotationStep
    }
    snapping = true
  },
  { passive: true }
)

canvas.addEventListener('pointerdown', (event) => {
  isDragging = true
  dragLastX = event.clientX
  snapping = false
  canvas.setPointerCapture(event.pointerId)
})

canvas.addEventListener('pointermove', (event) => {
  if (!isDragging) return
  const deltaX = event.clientX - dragLastX
  dragLastX = event.clientX
  worldRotation += deltaX * 0.003
  targetRotation = worldRotation
  updateActiveFromRotation()
})

const endDrag = (event: PointerEvent) => {
  if (!isDragging) return
  isDragging = false
  canvas.releasePointerCapture(event.pointerId)
}

canvas.addEventListener('pointerup', endDrag)
canvas.addEventListener('pointerleave', endDrag)

const clock = new THREE.Clock()
const labelAnchor = new THREE.Vector3()
const labelScreen = new THREE.Vector3()
const animate = () => {
  const elapsed = clock.getElapsedTime()
  boat.position.y = -1.1 + Math.sin(elapsed * 1.6) * 0.03
  boat.rotation.z = Math.sin(elapsed * 1.2) * 0.03
  water.material.uniforms.time.value = elapsed
  fogTexture.offset.x = elapsed * 0.01
  fogTexture.offset.y = -elapsed * 0.005
  clouds.children.forEach((child, index) => {
    child.position.x += 0.002 + index * 0.0002
    if (child.position.x > 40) {
      child.position.x = -40
    }
  })

  ;(mist.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  ;(spray.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true

  camera.position.x += (targetX - camera.position.x) * 0.04
  camera.position.y += (0.5 - targetY - camera.position.y) * 0.04
  camera.lookAt(0, 0.3, 0)

  stars.forEach((field, index) => {
    field.rotation.y = elapsed * 0.02 * (index + 1)
  })

  if (snapping) {
    worldRotation += (targetRotation - worldRotation) * 0.02
    if (Math.abs(targetRotation - worldRotation) < 0.0005) {
      snapping = false
    }
  } else {
    worldRotation += (targetRotation - worldRotation) * 0.02
  }
  if (holdLeft) {
    worldRotation += holdSpeed
    targetRotation = worldRotation
  }
  if (holdRight) {
    worldRotation -= holdSpeed
    targetRotation = worldRotation
  }
  const sway = Math.sin(elapsed * 0.6) * 0.03
  world.rotation.y = worldRotation + sway
  updateActiveFromRotation()

  islandMeshes.forEach((island, index) => {
    island.position.y = -0.45 + Math.sin(elapsed * 1.0 + index) * 0.02
  })

  const width = renderer.domElement.clientWidth
  const height = renderer.domElement.clientHeight
  islandMeshes.forEach((island, index) => {
    const card = cards[index]
    if (!card) return
    if (index !== activeIndex) {
      card.style.opacity = '0.04'
      card.style.background = 'rgba(6, 10, 18, 0.92)'
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
      card.style.background = 'rgba(6, 10, 18, 0.97)'
    }
    card.style.transform = `translate(-50%, -90%) translate(${x}px, ${y}px)`
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

