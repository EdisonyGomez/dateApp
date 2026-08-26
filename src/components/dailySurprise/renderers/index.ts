import type React from "react"
import type { SurpriseKind } from "@/lib/dailySurprise/types"
import type { RendererProps } from "./shared"
import { MessageRenderer, FactRenderer, ImageRenderer } from "./PassiveRenderers"
import { JokeRenderer, RiddleRenderer } from "./RevealRenderers"
import { TriviaRenderer } from "./TriviaRenderer"
import { ScrambleRenderer } from "./ScrambleRenderer"
import { LanguageRenderer } from "./LanguageRenderer"

/**
 * Registry: cada tipo de contenido → su renderer.
 * Agregar un tipo nuevo = 1 archivo + 1 línea acá.
 */
export const RENDERERS: Record<SurpriseKind, React.FC<RendererProps>> = {
  message: MessageRenderer,
  fact: FactRenderer,
  image: ImageRenderer,
  joke: JokeRenderer,
  riddle: RiddleRenderer,
  trivia: TriviaRenderer,
  scramble: ScrambleRenderer,
  language: LanguageRenderer,
}
