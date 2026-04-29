export function LogoV2() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-12 p-8">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 mb-6">feelzlike.com - Final Logo</p>
        <img
          src="/__mockup/logo-full.png"
          alt="feelzlike logo"
          className="w-[400px] h-auto"
        />
      </div>

      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 mb-6">On Dark</p>
        <div className="bg-slate-900 rounded-2xl p-10 inline-block" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <img
            src="/__mockup/logo-full.png"
            alt="feelzlike logo on dark"
            className="w-[320px] h-auto"
          />
        </div>
      </div>
    </div>
  );
}
