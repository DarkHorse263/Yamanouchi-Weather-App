export function LogoV2() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-20 p-12">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 mb-8">Variant B — Dot Accent</p>
        <div className="flex items-center justify-center gap-0">
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 300, letterSpacing: '0.06em', color: '#1E293B' }}>
            feelzlike
          </span>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
            display: 'inline-block',
            marginLeft: 4,
            marginBottom: -2,
            alignSelf: 'flex-end',
          }} />
        </div>
        <p className="text-[11px] text-slate-400 mt-6 tracking-wider">Light weight, monochrome text, small gradient dot</p>
      </div>

      <div className="flex gap-12 items-end">
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">App Icon</p>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            position: 'relative',
          }}>
            <span style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 32, fontWeight: 300, color: '#E2E8F0',
              letterSpacing: '0.05em',
            }}>fz</span>
            <span style={{
              position: 'absolute', bottom: 14, right: 14,
              width: 5, height: 5, borderRadius: '50%',
              background: 'linear-gradient(135deg, #60A5FA, #22D3EE)',
            }} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">On Dark</p>
          <div style={{
            background: '#0F172A', borderRadius: 16, padding: '24px 40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <div className="flex items-center">
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 300, letterSpacing: '0.06em', color: '#E2E8F0' }}>
                feelzlike
              </span>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'linear-gradient(135deg, #60A5FA, #22D3EE)',
                display: 'inline-block',
                marginLeft: 3,
                alignSelf: 'flex-end',
                marginBottom: 6,
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
