/**
 * Global SVG displacement filter for Apple Liquid Glass optical refraction.
 * Rendered once in MainLayout so all glass surfaces can reference #liquid-glass-refraction.
 */
export function LiquidGlassFilters() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <filter
          id="liquid-glass-refraction"
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves={2}
            seed={5}
            result="noise"
          />
          <feGaussianBlur stdDeviation="4" in="noise" result="smoothNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothNoise"
            scale={14}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
