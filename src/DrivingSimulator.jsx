import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * ============================================================================
 * DRIVING SIMULATOR DASHBOARD
 * ============================================================================
 * Self-contained, single-file React component (hooks only, no external
 * libraries beyond React + Tailwind CSS): a tachometer, a speedometer, a
 * 7-gear manual shifter, a throttle ("gas pedal"), a synthesized multi-layer
 * engine note via the Web Audio API, and full keyboard control:
 *
 *   SPACE        hold to accelerate, release to coast
 *   ARROW UP     shift up   (N → 1 → 2 → ... → 6)
 *   ARROW DOWN   shift down (6 → 5 → ... → 1 → N)
 *
 * DROP-IN USAGE: import DrivingSimulator from "./DrivingSimulator";
 *                 then render <DrivingSimulator /> inside a Tailwind app.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// TUNING CONSTANTS
// ---------------------------------------------------------------------------
const IDLE_RPM = 800; // engine idles here when coasting / throttle released
const REDLINE_RPM = 7000; // absolute rev ceiling
const REDLINE_WARN_RPM = 6000; // gauges/text turn red at and above this point

// Gear ratios: lower gears have big multipliers (more torque, less top speed),
// higher gears have small multipliers (less torque, more top speed).
const GEAR_RATIOS = { 1: 3.5, 2: 2.0, 3: 1.4, 4: 1.0, 5: 0.8, 6: 0.6 };
const GEARS = ["N", 1, 2, 3, 4, 5, 6];

// Speed = (RPM / gearRatio) * SPEED_FACTOR
// Back-solved so redline (7000 RPM) in 6th gear (ratio 0.6) lands ~160 mph.
const TOP_SPEED_MPH = 160;
const SPEED_FACTOR = (TOP_SPEED_MPH * GEAR_RATIOS[6]) / REDLINE_RPM; // ≈ 0.013714

// Rates that control how "snappy" the engine feels (tweak to taste)
const RPM_RISE_RATE = 4200; // rpm/sec at full throttle, low RPM
const RPM_FALL_RATE = 3000; // rpm/sec decay toward idle when throttle released
const NEUTRAL_COAST_DECEL = 14; // mph/sec speed bleed-off while in Neutral

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// ---------------------------------------------------------------------------
// GAUGE GEOMETRY HELPERS
// A classic automotive gauge sweeps 270° with a 90° gap centered at the
// bottom. Angle 0° = 12 o'clock, and angle increases CLOCKWISE.
// ---------------------------------------------------------------------------
const GAUGE_START_ANGLE = 225; // lower-left, where the minimum value sits
const GAUGE_SWEEP = 270; // total degrees the needle can travel

function valueToAngle(value, min, max) {
  const pct = clamp((value - min) / (max - min), 0, 1);
  return GAUGE_START_ANGLE + pct * GAUGE_SWEEP;
}

function polarPoint(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarPoint(cx, cy, r, startAngle);
  const end = polarPoint(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// ---------------------------------------------------------------------------
// WEB AUDIO HELPERS (module scope — no need to recreate these per render)
// ---------------------------------------------------------------------------

// Classic soft-clip curve for WaveShaperNode — adds harmonic "grit" so the
// engine tone doesn't sound like a bare synth oscillator.
function makeDistortionCurve(amount = 18) {
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// A couple of seconds of white noise, looped, for exhaust/intake air texture.
function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// ---------------------------------------------------------------------------
// GAUGE COMPONENT — reused for both the tachometer and the speedometer
// ---------------------------------------------------------------------------
function Gauge({ value, min, max, majorStep, minorStep, redlineStart, unit, label, accent, danger, formatValue }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 112;
  const tickOuterR = 104;
  const majorTickLen = 14;
  const minorTickLen = 7;

  const needleAngle = valueToAngle(value, min, max);

  const ticks = [];
  for (let v = min; v <= max; v += minorStep) {
    const isMajor = Math.round((v - min) / majorStep) * majorStep + min === v;
    const angle = valueToAngle(v, min, max);
    const len = isMajor ? majorTickLen : minorTickLen;
    const p1 = polarPoint(cx, cy, tickOuterR, angle);
    const p2 = polarPoint(cx, cy, tickOuterR - len, angle);
    const inRedline = redlineStart !== undefined && v >= redlineStart;
    ticks.push(
      <line
        key={`tick-${v}`}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={inRedline ? "#ef4444" : isMajor ? "#e5e5e5" : "#737373"}
        strokeWidth={isMajor ? 2.5 : 1.25}
        strokeLinecap="round"
      />
    );
    if (isMajor) {
      const labelPoint = polarPoint(cx, cy, tickOuterR - majorTickLen - 16, angle);
      ticks.push(
        <text
          key={`label-${v}`}
          x={labelPoint.x}
          y={labelPoint.y}
          fill={inRedline ? "#ef4444" : "#a3a3a3"}
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {majorStep >= 1000 ? v / 1000 : v}
        </text>
      );
    }
  }

  const needleTip = polarPoint(cx, cy, outerR - 20, needleAngle);
  const needleBaseL = polarPoint(cx, cy, 10, needleAngle + 90);
  const needleBaseR = polarPoint(cx, cy, 10, needleAngle - 90);

  const redlineAngleStart = redlineStart !== undefined ? valueToAngle(redlineStart, min, max) : null;
  const redlineAngleEnd = valueToAngle(max, min, max);

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={outerR + 8} fill="url(#faceGradient)" />
        <defs>
          <radialGradient id="faceGradient" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#1c1c1f" />
            <stop offset="75%" stopColor="#111113" />
            <stop offset="100%" stopColor="#0a0a0b" />
          </radialGradient>
        </defs>

        <path
          d={describeArc(cx, cy, tickOuterR + 6, GAUGE_START_ANGLE, GAUGE_START_ANGLE + GAUGE_SWEEP)}
          fill="none"
          stroke="#27272a"
          strokeWidth={3}
        />

        {redlineAngleStart !== null && (
          <path
            d={describeArc(cx, cy, tickOuterR + 6, redlineAngleStart, redlineAngleEnd)}
            fill="none"
            stroke="#ef4444"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {ticks}

        <g style={{ filter: `drop-shadow(0 0 6px ${danger ? "#ef4444" : accent})` }}>
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBaseL.x},${needleBaseL.y} ${needleBaseR.x},${needleBaseR.y}`}
            fill={danger ? "#ef4444" : accent}
          />
          <circle cx={cx} cy={cy} r={11} fill="#18181b" stroke={danger ? "#ef4444" : accent} strokeWidth={2.5} />
        </g>

        <text
          x={cx}
          y={cy + 46}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="26"
          fontWeight="700"
          fill={danger ? "#ef4444" : "#f5f5f5"}
          style={{ letterSpacing: "1px" }}
        >
          {formatValue(value)}
        </text>
        <text
          x={cx}
          y={cy + 64}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          fill="#71717a"
          style={{ letterSpacing: "3px" }}
        >
          {unit}
        </text>
      </svg>
      <div className="mt-1 text-xs font-semibold tracking-[0.3em] text-neutral-500">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function DrivingSimulator() {
  // ---- Rendered state (drives the UI) --------------------------------------
  const [rpm, setRpm] = useState(IDLE_RPM);
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState("N");
  const [throttle, setThrottle] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // ---- Mirror refs (avoid stale closures inside the rAF loop) -------------
  const rpmRef = useRef(IDLE_RPM);
  const speedRef = useRef(0);
  const gearRef = useRef("N");
  const throttleRef = useRef(false);

  // ---- Web Audio refs ---------------------------------------------------
  const audioCtxRef = useRef(null);
  const oscMainRef = useRef(null); // sawtooth lead tone (frequency tracks RPM)
  const oscUnisonRef = useRef(null); // detuned sawtooth for thickness/beating
  const oscSubRef = useRef(null); // square wave one octave down, for body/rumble
  const shaperFilterRef = useRef(null); // lowpass after distortion, brightens with RPM
  const noiseFilterRef = useRef(null); // bandpass on the noise layer, tracks RPM
  const noiseGainRef = useRef(null);
  const limiterDepthRef = useRef(null); // modulation depth for rev-limiter chatter
  const masterGainRef = useRef(null);

  // ---------------------------------------------------------------------------
  // GEAR SHIFTING
  // Instantly recompute RPM to match the new gear ratio so that road SPEED
  // stays constant through the shift (just like a real synchromesh gearbox).
  // ---------------------------------------------------------------------------
  const selectGear = useCallback((newGear) => {
    const currentSpeed = speedRef.current;

    if (newGear === "N") {
      gearRef.current = "N";
      setGear("N");
      return;
    }

    const ratio = GEAR_RATIOS[newGear];
    const matchedRpm = clamp((currentSpeed * ratio) / SPEED_FACTOR, IDLE_RPM, REDLINE_RPM);

    gearRef.current = newGear;
    rpmRef.current = matchedRpm;
    setGear(newGear);
    setRpm(matchedRpm);
  }, []);

  // Shift relative to the current gear: +1 = up, -1 = down. Used by ArrowUp/ArrowDown.
  const shiftGearRelative = useCallback(
    (direction) => {
      const currentIndex = GEARS.indexOf(gearRef.current);
      const nextIndex = clamp(currentIndex + direction, 0, GEARS.length - 1);
      const nextGear = GEARS[nextIndex];
      if (nextGear !== gearRef.current) selectGear(nextGear);
    },
    [selectGear]
  );

  // ---------------------------------------------------------------------------
  // THROTTLE HANDLERS (mouse + touch + keyboard all funnel through these)
  // ---------------------------------------------------------------------------
  const pressThrottle = useCallback(() => {
    throttleRef.current = true;
    setThrottle(true);
  }, []);
  const releaseThrottle = useCallback(() => {
    throttleRef.current = false;
    setThrottle(false);
  }, []);

  // ---------------------------------------------------------------------------
  // KEYBOARD CONTROLS — Space to accelerate, ArrowUp/ArrowDown to shift
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // stop page scroll + default button activation
        pressThrottle();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        if (!e.repeat) shiftGearRelative(1);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        if (!e.repeat) shiftGearRelative(-1);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        releaseThrottle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pressThrottle, releaseThrottle, shiftGearRelative]);

  // ---------------------------------------------------------------------------
  // PHYSICS + AUDIO LOOP (requestAnimationFrame, delta-time based)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp dt to avoid tab-switch jumps
      lastTime = now;

      // --- RPM update ---
      if (throttleRef.current) {
        const headroom = (REDLINE_RPM - rpmRef.current) / (REDLINE_RPM - IDLE_RPM);
        const riseRate = RPM_RISE_RATE * (0.35 + 0.65 * clamp(headroom, 0, 1));
        rpmRef.current = clamp(rpmRef.current + riseRate * dt, IDLE_RPM, REDLINE_RPM);
      } else if (rpmRef.current > IDLE_RPM) {
        rpmRef.current = clamp(rpmRef.current - RPM_FALL_RATE * dt, IDLE_RPM, REDLINE_RPM);
      }

      // --- Speed update ---
      if (gearRef.current === "N") {
        speedRef.current = Math.max(0, speedRef.current - NEUTRAL_COAST_DECEL * dt);
      } else {
        const ratio = GEAR_RATIOS[gearRef.current];
        speedRef.current = (rpmRef.current / ratio) * SPEED_FACTOR;
      }

      setRpm(rpmRef.current);
      setSpeed(speedRef.current);

      // --- Live audio parameter updates ---
      const ctx = audioCtxRef.current;
      if (ctx && oscMainRef.current && masterGainRef.current) {
        // Base pitch mapping per spec: frequency = rpm/15 + 50, plus a tiny
        // random wobble so the tone isn't perfectly clean/synthetic.
        const jitter = (Math.random() - 0.5) * 2.5;
        const freq = rpmRef.current / 15 + 50 + jitter;

        oscMainRef.current.frequency.setValueAtTime(freq, ctx.currentTime);
        oscUnisonRef.current.frequency.setValueAtTime(freq, ctx.currentTime);
        oscSubRef.current.frequency.setValueAtTime(freq / 2, ctx.currentTime);

        // Tone brightens (filter opens up) and noise texture rises with RPM
        shaperFilterRef.current.frequency.setValueAtTime(400 + rpmRef.current * 1.1, ctx.currentTime);
        noiseFilterRef.current.frequency.setValueAtTime(500 + rpmRef.current * 0.6, ctx.currentTime);

        const throttleOn = throttleRef.current;
        const targetGain = throttleOn ? 0.09 : 0.05;
        masterGainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);

        const targetNoise = throttleOn ? 0.03 : 0.015;
        noiseGainRef.current.gain.setTargetAtTime(targetNoise, ctx.currentTime, 0.1);

        // Rev-limiter "chatter" — kicks in only when bouncing off redline
        // under throttle, mimicking a real fuel-cut limiter stutter.
        const nearLimiter = throttleOn && rpmRef.current >= REDLINE_RPM - 40;
        limiterDepthRef.current.gain.setTargetAtTime(nearLimiter ? 0.05 : 0, ctx.currentTime, 0.03);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // ---------------------------------------------------------------------------
  // WEB AUDIO — layered synthetic engine note
  //   • oscMain + oscUnison (detuned sawtooths) -> waveshaper distortion ->
  //     lowpass filter   → the tonal "growl", thickened by the slight beating
  //     between the two detuned saws and given grit by the distortion.
  //   • oscSub (square, one octave down)         → low-end body/rumble.
  //   • filtered white noise                     → air/exhaust rasp texture.
  //   • limiterOsc -> limiterDepth -> masterGain.gain
  //                                               → rev-limiter stutter, only
  //     audible right at redline under throttle.
  // Only created/started while `soundEnabled` is true (valid user gesture),
  // and fully torn down (oscillators stopped, context closed) when toggled
  // off or on unmount.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!soundEnabled) return undefined;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();

    const oscMain = ctx.createOscillator();
    oscMain.type = "sawtooth";

    const oscUnison = ctx.createOscillator();
    oscUnison.type = "sawtooth";
    oscUnison.detune.value = 9; // slight detune -> beating/thickness, like multiple cylinders

    const oscSub = ctx.createOscillator();
    oscSub.type = "square";

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(18);
    shaper.oversample = "2x";

    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = "lowpass";
    toneFilter.frequency.value = 800;
    toneFilter.Q.value = 0.7;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx);
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 600;
    noiseFilter.Q.value = 0.9;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.015;

    const limiterOsc = ctx.createOscillator();
    limiterOsc.type = "square";
    limiterOsc.frequency.value = 16; // fast chatter rate

    const limiterDepth = ctx.createGain();
    limiterDepth.gain.value = 0; // silent unless bouncing off redline

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001; // fade in from silence to avoid a click/pop

    // Tonal path: two detuned saws -> distortion -> filter -> master
    oscMain.connect(shaper);
    oscUnison.connect(shaper);
    shaper.connect(toneFilter);
    toneFilter.connect(masterGain);

    // Sub rumble goes straight to master, kept clean
    oscSub.connect(masterGain);

    // Noise texture path
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    // Limiter chatter modulates the master gain's AudioParam directly
    limiterOsc.connect(limiterDepth);
    limiterDepth.connect(masterGain.gain);

    masterGain.connect(ctx.destination);

    oscMain.start();
    oscUnison.start();
    oscSub.start();
    noiseSource.start();
    limiterOsc.start();
    masterGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);

    audioCtxRef.current = ctx;
    oscMainRef.current = oscMain;
    oscUnisonRef.current = oscUnison;
    oscSubRef.current = oscSub;
    shaperFilterRef.current = toneFilter;
    noiseFilterRef.current = noiseFilter;
    noiseGainRef.current = noiseGain;
    limiterDepthRef.current = limiterDepth;
    masterGainRef.current = masterGain;

    return () => {
      try {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        oscMain.stop(ctx.currentTime + 0.16);
        oscUnison.stop(ctx.currentTime + 0.16);
        oscSub.stop(ctx.currentTime + 0.16);
        noiseSource.stop(ctx.currentTime + 0.16);
        limiterOsc.stop(ctx.currentTime + 0.16);
      } catch (err) {
        // no-op — nodes may already be stopped
      }
      window.setTimeout(() => ctx.close(), 220);
      audioCtxRef.current = null;
      oscMainRef.current = null;
      oscUnisonRef.current = null;
      oscSubRef.current = null;
      shaperFilterRef.current = null;
      noiseFilterRef.current = null;
      noiseGainRef.current = null;
      limiterDepthRef.current = null;
      masterGainRef.current = null;
    };
  }, [soundEnabled]);

  // ---------------------------------------------------------------------------
  // DERIVED DISPLAY STATE
  // ---------------------------------------------------------------------------
  const isRedline = rpm >= REDLINE_WARN_RPM;

  let statusLabel = "IDLE";
  if (gear === "N" && speed > 1) statusLabel = "COASTING";
  else if (gear === "N") statusLabel = "NEUTRAL";
  else if (isRedline) statusLabel = "REDLINE!";
  else if (throttle) statusLabel = "ACCELERATING";

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        {/* ---------------- Header ---------------- */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${throttle ? "bg-amber-400" : "bg-neutral-700"}`} />
            <h1 className="text-sm font-bold tracking-[0.35em] text-neutral-400">DASH // SIM-01</h1>
          </div>
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition
              ${soundEnabled
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              {soundEnabled ? (
                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" strokeLinecap="round" />
              ) : (
                <path d="m17 9 4 6M21 9l-4 6" strokeLinecap="round" />
              )}
            </svg>
            {soundEnabled ? "SOUND ON" : "SOUND OFF"}
          </button>
        </div>

        {/* ---------------- Dashboard panel ---------------- */}
        <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-2xl shadow-black/60">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)",
            }}
          />

          {/* Gauges */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 place-items-center">
            <Gauge
              value={rpm}
              min={0}
              max={REDLINE_RPM}
              majorStep={1000}
              minorStep={500}
              redlineStart={REDLINE_WARN_RPM}
              unit="RPM x1000"
              label="TACHOMETER"
              accent="#fbbf24"
              danger={isRedline}
              formatValue={(v) => Math.round(v).toLocaleString()}
            />
            <Gauge
              value={speed}
              min={0}
              max={180}
              majorStep={20}
              minorStep={10}
              unit="MPH"
              label="SPEEDOMETER"
              accent="#22d3ee"
              danger={false}
              formatValue={(v) => Math.round(v)}
            />
          </div>

          {/* Status strip */}
          <div className="relative mt-2 flex items-center justify-center gap-3">
            <div className="rounded-lg border border-neutral-800 bg-black/40 px-4 py-1.5 font-mono text-xs tracking-[0.25em] text-neutral-400">
              GEAR{" "}
              <span className={`ml-1 text-base font-bold ${gear === "N" ? "text-neutral-300" : "text-amber-400"}`}>
                {gear}
              </span>
            </div>
            <div
              className={`rounded-lg border px-4 py-1.5 font-mono text-xs tracking-[0.25em] transition-colors
                ${isRedline
                  ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
                  : "border-neutral-800 bg-black/40 text-neutral-400"}`}
            >
              {statusLabel}
            </div>
          </div>

          {/* ---------------- Gear selector ---------------- */}
          <div className="relative mt-6">
            <div className="mb-2 text-center text-[10px] font-semibold tracking-[0.3em] text-neutral-500">
              GEAR SELECTOR
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {GEARS.map((g) => (
                <button
                  key={g}
                  onClick={() => selectGear(g)}
                  className={`h-11 w-11 rounded-xl border font-mono text-sm font-bold transition-all
                    ${gear === g
                      ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.35)] scale-105"
                      : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* ---------------- Gas pedal ---------------- */}
          <div className="relative mt-6">
            <button
              onMouseDown={pressThrottle}
              onMouseUp={releaseThrottle}
              onMouseLeave={releaseThrottle}
              onTouchStart={(e) => {
                e.preventDefault();
                pressThrottle();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                releaseThrottle();
              }}
              className={`w-full select-none rounded-2xl border-2 py-6 text-center font-black tracking-[0.4em] transition-all active:scale-[0.97]
                ${throttle
                  ? "border-amber-400 bg-gradient-to-b from-amber-500/30 to-amber-600/10 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.35)]"
                  : "border-neutral-700 bg-neutral-900 text-neutral-500"}`}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)",
              }}
            >
              GAS PEDAL
            </button>
            <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-neutral-600">
              HOLD OR PRESS SPACE TO ACCELERATE &nbsp;•&nbsp; ↑ / ↓ TO SHIFT GEARS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}