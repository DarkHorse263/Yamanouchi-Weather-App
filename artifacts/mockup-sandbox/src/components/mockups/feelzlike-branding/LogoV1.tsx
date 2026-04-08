export function LogoV1() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-20 p-12">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 mb-10">A — Curved Trail Z</p>
        <svg viewBox="0 0 420 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[420px] h-[60px]">
          <text x="0" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#1E293B">feel</text>
          <g transform="translate(142, 6)">
            <path d="M2,6 C8,6 14,6 22,6" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M22,6 C18,16 12,28 8,38 C5,44 3,48 2,50" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M2,50 C8,50 14,50 22,50" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </g>
          <text x="170" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#1E293B">like</text>
        </svg>
        <p className="text-[11px] text-slate-400 mt-6 tracking-wider">Thin curved strokes — the Z diagonal flows like a winding trail</p>
      </div>

      <div className="flex gap-16 items-end">
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">Icon</p>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M6,8 C10,8 16,8 24,8" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M24,8 C20,14 14,20 8,26" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M6,26 C12,26 18,26 24,26" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">Dark</p>
          <div style={{ background: '#0F172A', borderRadius: 16, padding: '20px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <svg viewBox="0 0 420 60" fill="none" className="w-[260px] h-[38px]">
              <text x="0" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#CBD5E1">feel</text>
              <g transform="translate(142, 6)">
                <path d="M2,6 C8,6 14,6 22,6" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <path d="M22,6 C18,16 12,28 8,38 C5,44 3,48 2,50" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <path d="M2,50 C8,50 14,50 22,50" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </g>
              <text x="170" y="46" fontFamily="Inter, system-ui, sans-serif" fontSize="46" fontWeight="200" letterSpacing="3" fill="#CBD5E1">like</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
