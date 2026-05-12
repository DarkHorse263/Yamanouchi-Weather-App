import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

type Slide = {
  src: string;
  town: string;
  region: string;
  country: string;
};

const SLIDES: Slide[] = [
  {
    src: '/__mockup/images/town-jindabyne.jpg',
    town: 'Jindabyne',
    region: 'Snowy Mountains',
    country: 'NSW, Australia',
  },
  {
    src: '/__mockup/images/town-mount-beauty.jpg',
    town: 'Mount Beauty',
    region: 'Victoria\u2019s High Country',
    country: 'VIC, Australia',
  },
  {
    src: '/__mockup/images/town-yudanaka.jpg',
    town: 'Yudanaka',
    region: 'Yamanouchi',
    country: 'Nagano, Japan',
  },
];

const balance: React.CSSProperties = {
  textWrap: 'balance' as React.CSSProperties['textWrap'],
};
const pretty: React.CSSProperties = {
  textWrap: 'pretty' as React.CSSProperties['textWrap'],
};

export function PhotoLed() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      5000,
    );
    return () => window.clearInterval(id);
  }, []);

  const current = SLIDES[active];

  return (
    <div
      className="min-h-screen w-full bg-white text-slate-900"
      style={{
        fontFamily: "'DIN Pro', system-ui, sans-serif",
        ...pretty,
      }}
    >
      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        {/* Header: clean white, full colour logo, generous breathing room */}
        <header className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center md:pt-12 md:pb-8">
          <img
            src="/__mockup/images/logo-full-colour.png"
            alt="feelzlike"
            loading="eager"
            className="h-24 w-auto md:h-32"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Resort town mountain weather
          </p>
        </header>

        {/* Hero: resort town slideshow with caption */}
        <section className="relative mx-4 overflow-hidden rounded-2xl bg-slate-100 md:mx-6">
          <div className="relative aspect-[4/3] w-full md:aspect-[16/9]">
            {SLIDES.map((s, i) => (
              <img
                key={s.src}
                src={s.src}
                alt={`${s.town}, ${s.country}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}

            {/* Bottom scrim only, so the caption reads cleanly */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-900/75 via-slate-900/25 to-transparent" />

            {/* Caption */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  {current.region}
                </p>
                <h2 className="mt-1 text-2xl font-bold leading-tight text-white drop-shadow-sm md:text-3xl">
                  {current.town}
                </h2>
                <p className="mt-0.5 text-xs text-white/70">{current.country}</p>
              </div>

              {/* Slideshow indicators */}
              <div className="flex shrink-0 items-center gap-1.5 pb-1">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show slide ${i + 1}`}
                    onClick={() => setActive(i)}
                    className="h-1.5 rounded-full bg-white transition-all duration-500"
                    style={{
                      width: i === active ? 22 : 6,
                      opacity: i === active ? 1 : 0.55,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cue */}
        <div className="px-6 pt-7 pb-2 text-center md:pt-10">
          <h1
            className="text-2xl font-medium leading-snug text-slate-900 md:text-[28px]"
            style={balance}
          >
            I wonder what it feelzlike&nbsp;in&hellip;
          </h1>
        </div>

        {/* Country cards */}
        <section className="px-4 pt-5 pb-8 md:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Australia — snow season (May, southern hemisphere): blue */}
            <article className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(15,23,42,0.08)] ring-2 ring-sky-400/70">
              <header className="flex items-center gap-3">
                <span aria-hidden className="text-3xl leading-none">
                  &#127462;&#127482;
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight tracking-tight text-sky-900">
                    Australia
                  </h3>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                    </span>
                    Snow season &middot; 2 regions live
                  </p>
                </div>
              </header>

              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
                <li className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-slate-700">
                    <span className="font-semibold text-slate-900">Snowy Mountains</span>
                    <span className="text-slate-400"> &middot; </span>
                    Jindabyne
                  </span>
                  <span className="shrink-0 text-base font-bold tabular-nums text-sky-900">
                    8&deg;C
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-slate-700">
                    <span className="font-semibold text-slate-900">
                      Victoria&rsquo;s High Country
                    </span>
                    <span className="text-slate-400"> &middot; </span>
                    Bright
                  </span>
                  <span className="shrink-0 text-base font-bold tabular-nums text-sky-900">
                    14&deg;C
                  </span>
                </li>
              </ul>

              <a
                href="#"
                className="mt-4 inline-flex items-center text-xs font-semibold tracking-wide text-sky-700 hover:text-sky-900"
              >
                Explore Australia
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </a>
            </article>

            {/* Japan — off-snow season (May, northern hemisphere): emerald */}
            <article className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(15,23,42,0.08)] ring-2 ring-emerald-400/70">
              <header className="flex items-center gap-3">
                <span aria-hidden className="text-3xl leading-none">
                  &#127471;&#127477;
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight tracking-tight text-sky-900">
                    Japan
                  </h3>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Green season &middot; 1 region live
                  </p>
                </div>
              </header>

              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
                <li className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-slate-700">
                    <span className="font-semibold text-slate-900">Yamanouchi</span>
                    <span className="text-slate-400"> &middot; </span>
                    Yudanaka
                  </span>
                  <span className="shrink-0 text-base font-bold tabular-nums text-sky-900">
                    18&deg;C
                  </span>
                </li>
              </ul>

              <a
                href="#"
                className="mt-4 inline-flex items-center text-xs font-semibold tracking-wide text-sky-700 hover:text-sky-900"
              >
                Explore Japan
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </a>
            </article>
          </div>

          {/* Trust line */}
          <p
            className="mx-auto mt-8 max-w-sm text-center text-[11px] leading-relaxed text-slate-400"
            style={balance}
          >
            3 regions live &middot; 7 sources &middot; 15&nbsp;min refresh &middot;
            updated 4m&nbsp;ago
          </p>

          <p className="mt-5 text-center text-[10px] text-slate-300">&copy; feelzlike</p>
        </section>
      </div>
    </div>
  );
}
