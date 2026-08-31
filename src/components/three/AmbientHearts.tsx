import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

/** Sprite suave (bokeh) generado en canvas — sin assets externos. */
const makeSprite = (): THREE.CanvasTexture => {
  const c = document.createElement("canvas")
  c.width = c.height = 64
  const ctx = c.getContext("2d")!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, "rgba(255,255,255,0.95)")
  g.addColorStop(0.35, "rgba(255,190,214,0.75)")
  g.addColorStop(1, "rgba(255,190,214,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

const PALETTE = [
  new THREE.Color("#fb7185"),
  new THREE.Color("#f472b6"),
  new THREE.Color("#f9a8d4"),
  new THREE.Color("#ffffff"),
  new THREE.Color("#fda4af"),
]

/** Campo de partículas en profundidad, con parallax de scroll + puntero. */
function Field({ count = 180 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const sprite = useMemo(makeSprite, [])

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = Math.random() * 6 - 4
      const col = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    return { positions, colors }
  }, [count])

  useFrame((state) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime
    // deriva lenta
    g.rotation.y = t * 0.02
    // parallax de scroll (la escena "responde" al desplazamiento)
    const scroll = typeof window !== "undefined" ? window.scrollY : 0
    g.position.y = scroll * 0.0016
    // tilt sutil con el puntero
    g.rotation.x += (state.pointer.y * 0.12 - g.rotation.x) * 0.05
    g.rotation.z += (state.pointer.x * 0.08 - g.rotation.z) * 0.05
    // flotación
    g.position.x = Math.sin(t * 0.15) * 0.25
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.42}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/**
 * Capa ambiental 3D detrás del contenido. Solo se monta en tier 'full'
 * (lo decide el que la renderiza). Se pausa cuando la pestaña se oculta.
 */
export const AmbientHearts: React.FC = () => {
  const [active, setActive] = useState(!document.hidden)

  useEffect(() => {
    const onVis = () => setActive(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 62 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={active ? "always" : "never"}
      >
        <Field />
      </Canvas>
    </div>
  )
}
