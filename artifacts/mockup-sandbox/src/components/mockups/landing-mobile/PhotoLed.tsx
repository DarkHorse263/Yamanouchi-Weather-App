import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  { src: '/__mockup/images/town-slide-1.jpg', alt: 'Resort town' },
  { src: '/__mockup/images/town-slide-2.jpg', alt: 'Resort town' },
  { src: '/__mockup/images/town-slide-3.jpg', alt: 'Resort town' },
  { src: '/__mockup/images/town-slide-4.jpg', alt: 'Resort town' },
];

export function PhotoLed() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      4500,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-white text-slate-900"
      style={{
        fontFamily: "'DIN Pro', system-ui, sans-serif",
        textWrap: 'pretty' as React.CSSProperties['textWrap'],
      }}
    >
      <div className="mx-auto w-full max-w-md md:max-w-3xl">
        {/* Hero: town slideshow */}
        <section className="relative h-[460px] md:h-[520px] w-full overflow-hidden bg-slate-900">
          {SLIDES.map((s, i) => (
            <img
              key={s.src}
              src={s.src}
              alt={s.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))}

          {/* Scrims: soft top wash for logo legibility, deeper bottom wash for cue */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/70 via-white/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-900/55 via-slate-900/20 to-transparent" />

          {/* Logo lockup */}
          <div className="relative z-10 flex flex-col items-center px-6 pt-10 text-center">
            <img
              src="/__mockup/images/wordmark-colour.png"
              alt="feelzlike"
              loading="eager"
              className="h-16 w-auto md:h-24"
            />
            <p
              className="mt-3 text-[11px] font-semibold uppercase leading-snug tracking-[0.22em] text-slate-700"
              style={{ textWrap: 'balance' as React.CSSProperties['textWrap'] }}
            >
              Resort town mountain weather
            </p>
          </div>

          {/* Cue: sits in the lower-middle of the hero, well above the cards */}
          <div className="absolute inset-x-0 bottom-28 z-10 px-6 text-center md:bottom-32">
            <h1
              className="text-xl font-medium leading-snug text-white drop-shadow-md md:text-2xl"
              style={{ textWrap: 'balance' as React.CSSProperties['textWrap'] }}
            >
              I wonder what it feelzlike in&hellip;
            </h1>
          </div>

          {/* Slideshow dots */}
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full bg-white transition-all duration-500"
                style={{
                  width: i === active ? 18 : 6,
                  opacity: i === active ? 1 : 0.55,
                }}
              />
            ))}
          </div>
        </section>

        {/* Country cards: sit BELOW the hero, no overlap, so the cue stays visible */}
        <section className="relative -mt-6 px-4 pb-8 md:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Australia */}
            <article className="rounded-2xl bg-white p-5 shadow-[0_10px_40px_rgb(15,23,42,0.12)] ring-1 ring-slate-100">
              <header className="flex items-center gap-3">
                <span aria-hidden className="text-3xl leading-none">
                  &#127462;&#127482;
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-tight tracking-tight text-sky-900">
                    Australia
                  </h2>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    2 regions live
                  </p>
                </div>
              </header>

              <ul className="mt-4 space-y-2 text-sm leading-relaxed">
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

            {/* Japan */}
            <article className="rounded-2xl bg-white p-5 shadow-[0_10px_40px_rgb(15,23,42,0.12)] ring-1 ring-slate-100">
              <header className="flex items-center gap-3">
                <span aria-hidden className="text-3xl leading-none">
                  &#127471;&#127477;
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-tight tracking-tight text-sky-900">
                    Japan
                  </h2>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    1 region live
                  </p>
                </div>
              </header>

              <ul className="mt-4 space-y-2 text-sm leading-relaxed">
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
            style={{ textWrap: 'balance' as React.CSSProperties['textWrap'] }}
          >
            3 regions live &middot; 7 sources &middot; 15 min refresh &middot; updated 4m ago
          </p>

          <p className="mt-6 text-center text-[10px] text-slate-300">
            &copy; feelzlike
          </p>
        </section>
      </div>
    </div>
  );
}
