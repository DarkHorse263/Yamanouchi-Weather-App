export function LogoV2() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <svg viewBox="0 0 500 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[500px] h-[420px]">
        <defs>
          <linearGradient id="peakSmall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BDE0F5"/>
            <stop offset="100%" stopColor="#8ECAE6"/>
          </linearGradient>
          <linearGradient id="peakMid" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#8ECAE6"/>
            <stop offset="100%" stopColor="#5B9FCC"/>
          </linearGradient>
          <linearGradient id="peakRight" x1="0.3" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#4A90C4"/>
            <stop offset="100%" stopColor="#2563EB"/>
          </linearGradient>
          <linearGradient id="trail" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#A8D8F0"/>
            <stop offset="50%" stopColor="#6BB0D8"/>
            <stop offset="100%" stopColor="#3B82D0"/>
          </linearGradient>
        </defs>

        {/* Small left peak */}
        <polygon points="95,250 140,168 185,250" fill="url(#peakSmall)"/>

        {/* Left accent sliver */}
        <polygon points="105,250 168,115 185,250" fill="#9CC8E0" opacity="0.6"/>

        {/* Center tall peak */}
        <polygon points="155,250 240,50 330,250" fill="url(#peakMid)"/>

        {/* Right peak - darker blue */}
        <polygon points="270,250 350,95 415,250" fill="url(#peakRight)"/>

        {/* Swooping trail / ski run — S-curve winding through mountains */}
        <path d="
          M 120,175
          C 145,168 195,148 240,148
          C 290,148 340,168 370,185
          C 395,198 400,212 385,222
          C 365,235 325,225 285,228
          C 245,232 205,248 180,268
          C 160,284 155,300 165,315
          C 178,330 215,335 255,340
          C 285,344 310,352 325,362
        " stroke="url(#trail)" strokeWidth="30" strokeLinecap="round" fill="none" opacity="0.82"/>

        {/* White highlight on trail */}
        <path d="
          M 128,174
          C 153,167 200,149 243,149
          C 290,149 338,168 365,183
          C 388,195 393,208 380,218
          C 362,230 325,222 287,225
          C 248,229 210,245 186,264
          C 168,278 163,293 172,308
          C 183,322 218,328 256,333
          C 282,337 305,345 318,353
        " stroke="white" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.3"/>

        {/* Text: "feel" */}
        <text x="62" y="400" fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif" fontSize="70" fontWeight="600" fill="#0C2340" letterSpacing="-1">feel</text>

        {/* Text: "like" — positioned after the trail gap */}
        <text x="298" y="400" fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif" fontSize="70" fontWeight="600" fill="#0C2340" letterSpacing="-1">like</text>
      </svg>
    </div>
  );
}
