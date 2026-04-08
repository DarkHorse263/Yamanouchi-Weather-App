export function LogoV3() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-20 p-12">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 mb-8">Variant C — Split Tone</p>
        <div className="flex items-center justify-center">
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 200, letterSpacing: '0.1em', color: '#94A3B8' }}>
            feel
          </span>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 400, letterSpacing: '0.1em', color: '#1E293B' }}>
            z
          </span>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 200, letterSpacing: '0.1em', color: '#94A3B8' }}>
            like
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-6 tracking-wider">Two-tone — "feel" and "like" are light, "z" is dark and slightly heavier</p>
      </div>

      <div className="flex gap-12 items-end">
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">App Icon</p>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <span style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 36, fontWeight: 300,
              color: '#F1F5F9',
            }}>z</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">On Dark</p>
          <div style={{
            background: '#0F172A', borderRadius: 16, padding: '24px 40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <div className="flex items-center">
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 200, letterSpacing: '0.1em', color: '#475569' }}>
                feel
              </span>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 400, letterSpacing: '0.1em', color: '#F1F5F9' }}>
                z
              </span>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 200, letterSpacing: '0.1em', color: '#475569' }}>
                like
              </span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">Compact</p>
          <div className="flex items-center gap-1">
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              border: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 28, fontWeight: 300, color: '#1E293B' }}>z</span>
            </div>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, fontWeight: 300, letterSpacing: '0.15em', color: '#94A3B8', marginLeft: 8 }}>
              feelzlike
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
