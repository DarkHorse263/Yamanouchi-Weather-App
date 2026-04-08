export function LogoV2() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-16 p-12">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Variant B — Mountain Peak Z</p>
        <svg viewBox="0 0 380 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[380px] h-[80px]">
          <defs>
            <linearGradient id="zGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="50%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#10B981"/>
            </linearGradient>
          </defs>
          <text x="0" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#1E293B" letterSpacing="-2">feel</text>
          <g transform="translate(136,6)">
            <path d="M0,14 L12,14 L20,4 L28,14 L36,14" stroke="url(#zGrad2)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M36,14 Q18,36 6,56" stroke="url(#zGrad2)" strokeWidth="5" strokeLinecap="round" fill="none"/>
            <path d="M0,56 L36,56" stroke="url(#zGrad2)" strokeWidth="5" strokeLinecap="round" fill="none"/>
            <circle cx="20" cy="4" r="3" fill="#3B82F6" opacity="0.3"/>
          </g>
          <text x="176" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#1E293B" letterSpacing="-2">like</text>
        </svg>
        <p className="text-sm text-slate-500 mt-4">The Z top bar forms a mountain peak, diagonal curves like a trail/ski run</p>
      </div>

      <div className="flex gap-8 items-end">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">App Icon</p>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 rounded-2xl shadow-lg">
            <defs>
              <linearGradient id="iconGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6"/>
                <stop offset="50%" stopColor="#06B6D4"/>
                <stop offset="100%" stopColor="#10B981"/>
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="#1E293B"/>
            <path d="M14,20 L24,20 L32,10 L40,20 L50,20" stroke="url(#iconGrad2)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M50,20 Q28,34 16,48" stroke="url(#iconGrad2)" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            <path d="M14,48 L50,48" stroke="url(#iconGrad2)" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            <circle cx="32" cy="10" r="3.5" fill="#3B82F6" opacity="0.25"/>
          </svg>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">On Dark</p>
          <div className="bg-slate-900 rounded-2xl px-8 py-5 shadow-lg">
            <svg viewBox="0 0 380 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[253px] h-[54px]">
              <defs>
                <linearGradient id="zGrad2W" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA"/>
                  <stop offset="50%" stopColor="#22D3EE"/>
                  <stop offset="100%" stopColor="#34D399"/>
                </linearGradient>
              </defs>
              <text x="0" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#FFFFFF" letterSpacing="-2">feel</text>
              <g transform="translate(136,6)">
                <path d="M0,14 L12,14 L20,4 L28,14 L36,14" stroke="url(#zGrad2W)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M36,14 Q18,36 6,56" stroke="url(#zGrad2W)" strokeWidth="5" strokeLinecap="round" fill="none"/>
                <path d="M0,56 L36,56" stroke="url(#zGrad2W)" strokeWidth="5" strokeLinecap="round" fill="none"/>
                <circle cx="20" cy="4" r="3" fill="#60A5FA" opacity="0.3"/>
              </g>
              <text x="176" y="58" fontFamily="Inter,system-ui,sans-serif" fontSize="52" fontWeight="800" fill="#FFFFFF" letterSpacing="-2">like</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Gradient: Blue → Cyan → Green (snow to green season)</p>
        <div className="flex gap-3 justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-500"></div>
          <div className="w-8 h-8 rounded-full bg-cyan-500"></div>
          <div className="w-8 h-8 rounded-full bg-emerald-500"></div>
        </div>
      </div>
    </div>
  );
}
