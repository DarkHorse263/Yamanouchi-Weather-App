export function LogoV2() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-20 p-12">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 mb-10">B — Switchback Z</p>
        <svg viewBox="0 0 440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[440px] h-[60px]">
          <text x="0" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#1E293B">feel</text>
          <g transform="translate(142, 4)">
            <path d="M2,6 L24,6" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M24,6 L16,20 L22,20 L14,34 L20,34 L6,52" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M2,52 L24,52" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round"/>
          </g>
          <text x="172" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#1E293B">like</text>
        </svg>
        <p className="text-[11px] text-slate-400 mt-6 tracking-wider">Zigzag switchbacks down the diagonal — like a real mountain trail map</p>
      </div>

      <div className="flex gap-16 items-end">
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">Icon</p>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M6,7 L26,7" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M26,7 L18,13 L24,13 L16,19 L22,19 L8,27" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M6,27 L26,27" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">Dark</p>
          <div style={{ background: '#0F172A', borderRadius: 16, padding: '20px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <svg viewBox="0 0 440 60" fill="none" className="w-[270px] h-[38px]">
              <text x="0" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#CBD5E1">feel</text>
              <g transform="translate(142, 4)">
                <path d="M2,6 L24,6" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M24,6 L16,20 L22,20 L14,34 L20,34 L6,52" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M2,52 L24,52" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
              </g>
              <text x="172" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#CBD5E1">like</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
