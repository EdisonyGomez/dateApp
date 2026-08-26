import type React from "react"
import { useAuth } from "@/contexts/AuthProvider"
import { useDailySurprise } from "@/hooks/useDailySurprise"
import { isPassive } from "@/lib/dailySurprise/types"
import { DailySurpriseModal } from "./DailySurpriseModal"
import { SurpriseBadge } from "./SurpriseBadge"

/**
 * Punto de entrada de la Sorpresa Diaria. Se monta a nivel App (junto
 * al Toaster, dentro de AuthProvider) para sobrevivir a los early
 * returns del Dashboard. Se auto-protege si no hay usuario.
 */
export const DailySurprise: React.FC = () => {
  const { user, partner } = useAuth()
  const pad = useDailySurprise()

  if (!user || pad.status === "loading") return null

  const pending = pad.status === "ready" && !!pad.content && !isPassive(pad.content.kind) && !pad.completed

  return (
    <>
      {!pad.open && (
        <SurpriseBadge onClick={() => pad.setOpen(true)} completed={pad.completed} pending={pending} />
      )}
      <DailySurpriseModal
        open={pad.open}
        onOpenChange={pad.setOpen}
        status={pad.status}
        content={pad.content}
        completed={pad.completed}
        partnerState={pad.partnerState}
        partnerName={partner?.name}
        onComplete={pad.complete}
        learningLanguage={pad.learningLanguage}
        setLearningLanguage={pad.setLearningLanguage}
        onRetry={pad.reload}
      />
    </>
  )
}
