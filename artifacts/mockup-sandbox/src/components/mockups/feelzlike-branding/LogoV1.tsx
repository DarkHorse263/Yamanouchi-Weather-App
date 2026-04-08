export function LogoV1() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-16 p-12">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Variant A — Clean Z</p>
        <svg viewBox="0 0 360 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[360px] h-[80px]">
          <defs>
            <linearGradient id="zGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="100%" stopColor="#06B6D4"/>
            </linearGradient>
          </defs>
          <text x="0" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#1E293B" letterSpacing="-2">feel</text>
          <g transform="translate(138,8)">
            <path d="M0,12 L28,12 L4,58 L32,58" stroke="url(#zGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="20" cy="26" r="2" fill="#3B82F6" opacity="0.5"/>
            <circle cx="14" cy="38" r="1.5" fill="#06B6D4" opacity="0.6"/>
            <circle cx="9" cy="49" r="1.8" fill="#3B82F6" opacity="0.4"/>
          </g>
          <text x="172" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#1E293B" letterSpacing="-2">like</text>
        </svg>
        <p className="text-sm text-slate-500 mt-4">The Z as a ski run / hiking trail with snow dots</p>
      </div>

      <div className="flex gap-8 items-end">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">App Icon</p>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 rounded-2xl shadow-lg">
            <defs>
              <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6"/>
                <stop offset="100%" stopColor="#06B6D4"/>
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="#1E293B"/>
            <path d="M16,18 L48,18 L16,46 L48,46" stroke="url(#iconGrad)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="38" cy="25" r="2.5" fill="#3B82F6" opacity="0.6"/>
            <circle cx="30" cy="32" r="2" fill="#06B6D4" opacity="0.7"/>
            <circle cx="22" cy="39" r="2.5" fill="#3B82F6" opacity="0.5"/>
          </svg>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">On Dark</p>
          <div className="bg-slate-900 rounded-2xl px-8 py-5 shadow-lg">
            <svg viewBox="0 0 360 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[240px] h-[54px]">
              <defs>
                <linearGradient id="zGradW" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA"/>
                  <stop offset="100%" stopColor="#22D3EE"/>
                </linearGradient>
              </defs>
              <text x="0" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#FFFFFF" letterSpacing="-2">feel</text>
              <g transform="translate(138,8)">
                <path d="M0,12 L28,12 L4,58 L32,58" stroke="url(#zGradW)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="20" cy="26" r="2" fill="#60A5FA" opacity="0.5"/>
                <circle cx="14" cy="38" r="1.5" fill="#22D3EE" opacity="0.6"/>
                <circle cx="9" cy="49" r="1.8" fill="#60A5FA" opacity="0.4"/>
              </g>
              <text x="172" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#FFFFFF" letterSpacing="-2">like</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
