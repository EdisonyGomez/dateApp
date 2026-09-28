import type React from "react"
import { useMemo } from "react"
import type { WeatherKey } from "@/lib/calendar/weather"

/**
 * ───────────────────────────────────────────────
 *  WeatherFX — capa animada de fondo según el clima
 * ───────────────────────────────────────────────
 *  Declarativo: renderiza un set fijo de partículas con animaciones CSS en loop
 *  (nada de setInterval). Se apaga con prefers-reduced-motion. pointer-events:none.
 */

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

export const WeatherFX: React.FC<{ weather: WeatherKey }> = ({ weather }) => {
  // sets estables por clima (no se regeneran en cada render)
  const rain = useMemo(
    () =>
      Array.from({ length: weather === "storm" ? 60 : 40 }, () => ({
        left: rnd(0, 100),
        dur: rnd(weather === "storm" ? 0.35 : 0.5, weather === "storm" ? 0.6 : 0.9),
        delay: rnd(0, 1.2),
        op: rnd(0.4, 0.9),
      })),
    [weather],
  )
  const snow = useMemo(
    () => Array.from({ length: 30 }, () => ({ left: rnd(0, 100), dur: rnd(3, 6), delay: rnd(0, 5), size: rnd(8, 18) })),
    [],
  )
  const stars = useMemo(
    () => Array.from({ length: 24 }, () => ({ left: rnd(0, 100), top: rnd(0, 78), size: rnd(7, 15), delay: rnd(0, 2) })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{WFX_CSS}</style>

      {(weather === "clear" || weather === "hot") && (
        <>
          <div className="wfx-sun" />
          <div className="wfx-rays" />
        </>
      )}

      {weather === "clear" && (
        <>
          <span className="wfx-floaty" style={{ left: "12%", animationDuration: "6s" }}>😎</span>
          <span className="wfx-floaty" style={{ left: "42%", animationDuration: "7.5s", animationDelay: "2s" }}>🕶️</span>
        </>
      )}

      {weather === "hot" && (
        <>
          <div className="wfx-heat" />
          <span className="wfx-melt">🥵</span>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="wfx-sweat" style={{ right: `${18 + i * 6}px`, animationDelay: `${i * 0.2}s` }}>💦</span>
          ))}
          <span className="wfx-floaty" style={{ left: "20%", animationDuration: "4.5s" }}>🍦</span>
        </>
      )}

      {(weather === "rain" || weather === "storm") &&
        rain.map((r, i) => (
          <span
            key={i}
            className="wfx-rain"
            style={{ left: `${r.left}%`, animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s`, opacity: r.op }}
          />
        ))}

      {weather === "rain" && (
        <span className="wfx-floaty" style={{ left: "60%", animationDuration: "6s" }}>☔</span>
      )}

      {weather === "storm" && <div className="wfx-flash" />}

      {weather === "clouds" &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="wfx-cloud"
            style={{ top: `${8 + i * 28}px`, fontSize: `${28 + i * 10}px`, animationDuration: `${16 + i * 6}s`, animationDelay: `${-i * 5}s` }}
          >
            ☁️
          </span>
        ))}

      {weather === "snow" &&
        snow.map((s, i) => (
          <span
            key={i}
            className="wfx-snow"
            style={{ left: `${s.left}%`, fontSize: `${s.size}px`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
          >
            ❄️
          </span>
        ))}

      {weather === "night" && (
        <>
          <span className="wfx-moon">🌙</span>
          {stars.map((s, i) => (
            <span
              key={i}
              className="wfx-star"
              style={{ left: `${s.left}%`, top: `${s.top}%`, fontSize: `${s.size}px`, animationDelay: `${s.delay}s` }}
            >
              ✦
            </span>
          ))}
        </>
      )}

      {weather === "fog" &&
        [0, 1, 2, 3].map((i) => (
          <span key={i} className="wfx-fog" style={{ top: `${16 + i * 26}px`, animationDuration: `${6 + i * 2}s`, animationDelay: `${-i * 2}s` }} />
        ))}
    </div>
  )
}

const WFX_CSS = `
.wfx-sun{position:absolute;top:-30px;right:-14px;width:110px;height:110px;border-radius:50%;
  background:radial-gradient(circle,#fff6c2,#fbbf24 60%,#f59e0b);box-shadow:0 0 48px 12px rgba(251,191,36,.7);animation:wfxPulse 2.6s ease-in-out infinite}
.wfx-rays{position:absolute;top:-30px;right:-14px;width:110px;height:110px;border-radius:50%;
  background:conic-gradient(from 0deg,rgba(255,255,255,.55) 0 6deg,transparent 6deg 30deg);animation:wfxSpin 14s linear infinite}
@keyframes wfxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes wfxSpin{to{transform:rotate(360deg)}}
.wfx-heat{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 7px,rgba(255,255,255,.07) 8px,transparent 9px);animation:wfxHeat 1.4s ease-in-out infinite}
@keyframes wfxHeat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.wfx-melt{position:absolute;right:26px;bottom:6px;font-size:30px;animation:wfxShake .55s ease-in-out infinite}
@keyframes wfxShake{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
.wfx-sweat{position:absolute;bottom:32px;font-size:12px;animation:wfxDrop 1s linear infinite}
@keyframes wfxDrop{0%{transform:translateY(0);opacity:1}100%{transform:translateY(24px);opacity:0}}
.wfx-floaty{position:absolute;top:-16px;font-size:16px;animation:wfxFall linear infinite}
@keyframes wfxFall{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(150px) rotate(20deg);opacity:0}}
.wfx-rain{position:absolute;top:-20px;width:2px;height:16px;background:linear-gradient(transparent,rgba(255,255,255,.9));border-radius:2px;animation:wfxRain linear infinite}
@keyframes wfxRain{to{transform:translateY(200px)}}
.wfx-flash{position:absolute;inset:0;background:rgba(255,255,255,.9);opacity:0;animation:wfxFlash 6s linear infinite}
@keyframes wfxFlash{0%,93%,100%{opacity:0}94%{opacity:.85}95%{opacity:.1}96%{opacity:.7}97%{opacity:0}}
.wfx-cloud{position:absolute;opacity:.9;animation:wfxDrift linear infinite}
@keyframes wfxDrift{from{transform:translateX(-80px)}to{transform:translateX(700px)}}
.wfx-snow{position:absolute;top:-16px;color:#fff;animation:wfxSnow linear infinite}
@keyframes wfxSnow{0%{transform:translateY(0) translateX(0)}100%{transform:translateY(190px) translateX(20px)}}
.wfx-moon{position:absolute;top:8px;right:16px;font-size:30px}
.wfx-star{position:absolute;color:#fde68a;animation:wfxTwk 2s ease-in-out infinite}
@keyframes wfxTwk{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.25)}}
.wfx-fog{position:absolute;left:-40%;width:180%;height:26px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);opacity:.6;animation:wfxFog linear infinite}
@keyframes wfxFog{from{transform:translateX(-30%)}to{transform:translateX(30%)}}
@media (prefers-reduced-motion:reduce){.wfx-sun,.wfx-rays,.wfx-heat,.wfx-melt,.wfx-sweat,.wfx-floaty,.wfx-rain,.wfx-flash,.wfx-cloud,.wfx-snow,.wfx-star,.wfx-fog{animation:none!important}}
`
