import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

/** Textura de emoji dibujada en canvas (sin assets). */
const makeEmojiTexture = (emoji: string): THREE.CanvasTexture => {
  const c = document.createElement("canvas")
  c.width = c.height = 96
  const ctx = c.getContext("2d")!
  ctx.font = "72px serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(emoji, 48, 52)
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 4
  return t
}

interface Sprite {
  x: number
  y: number
  z: number
  scale: number
  tex: number
  phase: number
}

function EmojiField({ motifs, count = 34 }: { motifs: string[]; count?: number }) {
  const group = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const textures = useMemo(() => motifs.map(makeEmojiTexture), [motifs])

  const sprites = useMemo<Sprite[]>(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 11,
      y: (Math.random() - 0.5) * 11,
      z: Math.random() * 5 - 4,
      scale: 0.5 + Math.random() * 0.9,
      tex: Math.floor(Math.random() * Math.max(1, motifs.length)),
      phase: Math.random() * Math.PI * 2,
    }))
  }, [count, motifs.length])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y = t * 0.03
    g.rotation.x += (pointer.current.y * 0.14 - g.rotation.x) * 0.05
    g.rotation.z += (pointer.current.x * 0.1 - g.rotation.z) * 0.05
    g.children.forEach((child, i) => {
      const s = sprites[i]
      if (s) child.position.y = s.y + Math.sin(t * 0.5 + s.phase) * 0.35
    })
  })

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <sprite key={i} position={[s.x, s.y, s.z]} scale={[s.scale, s.scale, s.scale]}>
          <spriteMaterial map={textures[s.tex]} transparent opacity={0.92} depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

/** Fondo 3D temático. Se pausa con la pestaña oculta. */
export const ProfileThemeAmbient: React.FC<{ motifs: string[] }> = ({ motifs }) => {
  const [active, setActive] = useState(!document.hidden)
  useEffect(() => {
    const onVis = () => setActive(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 62 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={active ? "always" : "never"}
      >
        <EmojiField motifs={motifs} />
      </Canvas>
    </div>
  )
}
