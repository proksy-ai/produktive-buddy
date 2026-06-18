import { ImageResponse } from "next/og";

import { BRAND } from "@/lib/brand";

/**
 * Renders the app glyph as a PNG at a given size. Used for PWA manifest icons
 * and the Apple touch icon so we have a single source of truth for branding.
 */
export function renderBrandIcon(size: number, maskable = false) {
  // Maskable icons need a safe zone, so the glyph fills less of the canvas.
  const inset = maskable ? 0 : 0;
  const radius = maskable ? 0 : size * 0.22;
  const glyphSize = maskable ? size * 0.5 : size * 0.62;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          borderRadius: radius,
          padding: inset,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: glyphSize,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          {BRAND.shortName.charAt(0)}
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
