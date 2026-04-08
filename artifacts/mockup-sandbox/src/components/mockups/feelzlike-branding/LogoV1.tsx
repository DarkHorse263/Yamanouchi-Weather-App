export function LogoV1() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-20 p-12">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 mb-8">Variant A — Sleek Wordmark</p>
        <div className="flex items-center justify-center">
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 200, letterSpacing: '0.08em', color: '#1E293B' }}>
            feel
          </span>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 200, letterSpacing: '0.08em', color: '#1E293B', position: 'relative' }}>
            <span style={{
              background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 300,
            }}>z</span>
          </span>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 200, letterSpacing: '0.08em', color: '#1E293B' }}>
            like
          </span>
        </div>
        <div className="mt-3 flex justify-center">
          <div style={{ width: 160, height: 1, background: 'linear-gradient(90deg, transparent, #3B82F6, #06B6D4, transparent)' }} />
        </div>
        <p className="text-[11px] text-slate-400 mt-6 tracking-wider">Ultralight weight, gradient Z accent, subtle underline</p>
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
              fontSize: 36, fontWeight: 200,
              background: 'linear-gradient(135deg, #60A5FA, #22D3EE)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 200, letterSpacing: '0.08em', color: '#E2E8F0' }}>
                feel
              </span>
              <span style={{
                fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 300, letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #60A5FA, #22D3EE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>z</span>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 200, letterSpacing: '0.08em', color: '#E2E8F0' }}>
                like
              </span>
            </div>
            <div style={{ width: 120, height: 1, margin: '8px auto 0', background: 'linear-gradient(90deg, transparent, #60A5FA, #22D3EE, transparent)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
