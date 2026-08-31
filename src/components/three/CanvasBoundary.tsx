import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  /** Qué mostrar si el WebGL/R3F falla en runtime (ej: partículas 2D). */
  fallback: ReactNode
}

/**
 * Red de seguridad para la capa 3D. Si WebGL no está disponible o R3F
 * lanza en algún dispositivo, cae al fallback en vez de tumbar la app.
 * (Suspense solo atrapa la carga, no los errores de render.)
 */
export class CanvasBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AmbientHearts falló, usando fallback 2D:", error, info)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
