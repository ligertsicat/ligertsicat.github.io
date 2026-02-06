import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

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
scene.fog = new THREE.Fog(0x0e1420, 8, 28)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 2.4, 15)

const loader = new GLTFLoader()

const ambient = new THREE.AmbientLight(0x8aa0c8, 0.45)
scene.add(ambient)

const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
keyLight.position.set(4, 7, 3)
scene.add(keyLight)

const rimLight = new THREE.DirectionalLight(0x7ad1ff, 0.6)
rimLight.position.set(-6, 2, -3)
scene.add(rimLight)

const waterGeometry = new THREE.CircleGeometry(16, 128)
const waterUniforms = {
  uTime: { value: 0 },
  uColorDeep: { value: new THREE.Color(0x0a2236) },
  uColorShallow: { value: new THREE.Color(0x1f4f6b) },
  uFoam: { value: new THREE.Color(0x9ad7ff) },
}
const waterMaterial = new THREE.ShaderMaterial({
  uniforms: waterUniforms,
  transparent: true,
  vertexShader: `
    uniform float uTime;
    varying float vWave;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave1 = sin(pos.x * 0.6 + uTime * 0.7);
      float wave2 = sin(pos.y * 0.8 + uTime * 0.5);
      float ripple = sin((pos.x + pos.y) * 1.4 + uTime * 1.0);
      vWave = wave1 * 0.45 + wave2 * 0.4 + ripple * 0.35;
      pos.z += vWave * 0.28;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorDeep;
    uniform vec3 uColorShallow;
    uniform vec3 uFoam;
    varying float vWave;
    varying vec2 vUv;
    void main() {
      float depth = smoothstep(-0.4, 0.7, vWave);
      vec3 color = mix(uColorDeep, uColorShallow, depth);
      float foam = smoothstep(0.4, 0.7, vWave);
      color = mix(color, uFoam, foam * 0.6);
      float edge = smoothstep(0.2, 0.95, length(vUv - 0.5) * 2.0);
      float alpha = 0.95 * (1.0 - edge);
      gl_FragColor = vec4(color, alpha);
    }
  `,
})
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = -Math.PI / 2
water.position.y = -1.6
scene.add(water)

const world = new THREE.Group()
scene.add(world)

const islandRadius = 6
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
  (gltf) => {
    islandMeshes.forEach((island) => {
      const model = gltf.scene.clone(true)
      model.scale.set(0.03, 0.03, 0.03)
      model.position.set(0, -1.4, 0)
      island.add(model)
    })
  },
  undefined,
  (error) => {
    console.error('Failed to load island model', error)
  }
)

const boat = new THREE.Group()
boat.position.set(0, 0, 10)
scene.add(boat)

const boatUrl = new URL('./BoatWSail.glb', import.meta.url).toString()
loader.load(
  boatUrl,
  (gltf) => {
    const model = gltf.scene
    model.scale.set(0.9, 0.9, 0.9)
    model.rotation.y = Math.PI / 2
    model.position.set(0, -0.6, 0)
    boat.add(model)
  },
  undefined,
  (error) => {
    console.error('Failed to load boat model', error)
  }
)


const stars: THREE.Points[] = []
for (let i = 0; i < 3; i += 1) {
  const starGeo = new THREE.BufferGeometry()
  const starCount = 180
  const positions = new Float32Array(starCount * 3)
  for (let j = 0; j < starCount; j += 1) {
    const radius = 14 + Math.random() * 6
    const theta = Math.random() * Math.PI * 2
    const y = (Math.random() - 0.3) * 6
    positions[j * 3] = Math.cos(theta) * radius
    positions[j * 3 + 1] = y
    positions[j * 3 + 2] = Math.sin(theta) * radius
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const starMat = new THREE.PointsMaterial({
    color: 0xbddcff,
    size: 0.05,
    transparent: true,
    opacity: 0.6 - i * 0.12,
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
  const delta = clock.getDelta()
  const elapsed = clock.elapsedTime
  boat.position.y = Math.sin(elapsed * 1.6) * 0.08
  boat.rotation.z = Math.sin(elapsed * 1.2) * 0.03
  waterUniforms.uTime.value = elapsed

  camera.position.x += (targetX - camera.position.x) * 0.04
  camera.position.y += (2.4 - targetY - camera.position.y) * 0.04
  camera.lookAt(0, 0.3, 0)

  stars.forEach((field, index) => {
    field.rotation.y = elapsed * 0.02 * (index + 1)
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
    island.position.y = Math.sin(elapsed * 1.4 + index) * 0.05
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

  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
