import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the same folder as icon.svg, on a full-bleed square (iOS rounds it). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#191919" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M9 17a2 2 0 0 1 2-2h13.2a2 2 0 0 1 1.6.8L29 20h24a2 2 0 0 1 2 2v28H9z" fill="#0C7866" />
          <rect x="14" y="23" width="36" height="20" rx="1" fill="#fdfaf7" />
          <path d="M15.5 27.5h20M15.5 31.5h28M15.5 35.5h24" stroke="#191919" strokeWidth="1.6" opacity=".35" />
          <path
            d="M7.2 30.4A2 2 0 0 1 9.2 28h45.6a2 2 0 0 1 2 2.4l-3.4 19.9A2 2 0 0 1 51.4 52H12.6a2 2 0 0 1-2-1.7z"
            fill="#D71E1E"
          />
        </svg>
      </div>
    ),
    size,
  );
}
