import type React from "react"
import { Sparkles, Heart } from "lucide-react"
import { UserAvatar } from "@/components/UserAvatar"

/**
 * ───────────────────────────────────────────────
 *  CalendarHeader — identidad de la pareja (sobre el panel de clima)
 * ───────────────────────────────────────────────
 *  Avatares con anillo conic giratorio, corazón latiendo, nombre y label que
 *  adaptan su color al clima, + chip de temperatura. Presentacional puro.
 */

interface CalendarHeaderProps {
  me: { name: string; avatarUrl?: string | null }
  partner: { name: string; avatarUrl?: string | null } | null
  weather?: { label: string; icon: string; tempC: number | null; fg: string }
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ me, partner, weather }) => {
  const coupleName = partner ? `${me.name} & ${partner.name}` : me.name
  const fg = weather?.fg ?? "#3b3b40"

  return (
    <div className="flex min-w-0 items-center gap-3">
      <style>{CH_CSS}</style>

      <div className="relative flex items-center">
        <span className="ch-ring">
          <span className="ch-ring-in">
            <UserAvatar name={me.name} avatarUrl={me.avatarUrl ?? undefined} size="md" fallbackColor="bg-rose-500" />
          </span>
        </span>
        {partner && (
          <span className="ch-ring ch-ring-rev -ml-3">
            <span className="ch-ring-in">
              <UserAvatar name={partner.name} avatarUrl={partner.avatarUrl ?? undefined} size="md" fallbackColor="bg-violet-500" />
            </span>
          </span>
        )}
        {partner && (
          <span className="ch-heart">
            <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: fg, opacity: 0.9 }}>
          <Sparkles className="ch-spk h-3 w-3" />
          Our calendar
        </div>
        <div className="font-quick truncate text-lg font-extrabold drop-shadow-sm" style={{ color: fg }}>
          {coupleName}
        </div>
        {weather && (
          <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/65 px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur-sm">
            <span>{weather.icon}</span>
            {weather.tempC !== null && <span>{weather.tempC}°</span>}
            <span>{weather.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const CH_CSS = `
.ch-ring{border-radius:9999px;padding:3px;background:conic-gradient(from 0deg,#f472b6,#a78bfa,#7dd3fc,#6ee7b7,#fbbf24,#fb7185,#f472b6);animation:chSpin 5s linear infinite}
.ch-ring-rev{animation-duration:6.5s;animation-direction:reverse}
.ch-ring-in{display:block;border-radius:9999px;padding:2px;background:#fff}
@keyframes chSpin{to{transform:rotate(360deg)}}
.ch-heart{position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:20px;height:20px;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2);z-index:3;animation:chBeat 1.3s ease-in-out infinite}
@keyframes chBeat{0%,100%{transform:translateX(-50%) scale(1)}15%{transform:translateX(-50%) scale(1.3)}30%{transform:translateX(-50%) scale(1)}45%{transform:translateX(-50%) scale(1.18)}}
.ch-spk{animation:chTwk 1.9s ease-in-out infinite}
@keyframes chTwk{0%,100%{opacity:.5;transform:scale(.85)}50%{opacity:1;transform:scale(1.2)}}
@media (prefers-reduced-motion:reduce){.ch-ring,.ch-ring-rev,.ch-heart,.ch-spk{animation:none!important}}
`
