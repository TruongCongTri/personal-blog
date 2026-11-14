import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

type Card = { kicker: string; title: string; quote?: string; color: string; ink: string; site: string };

/** Social card in the folder look: an open folder in the film's colour, on the drawer's dark ground. */
export function ogCard({ kicker, title, quote, color, ink, site }: Card) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#191919", padding: "70px 80px 0" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
          {/* tab */}
          <div style={{ display: "flex", width: 260, height: 54, background: color, borderRadius: "10px 10px 0 0" }} />
          {/* folder */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              background: color,
              color: ink,
              borderRadius: "0 10px 0 0",
              padding: "48px 56px 60px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", opacity: 0.8 }}>
                {kicker}
              </div>
              <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1, textTransform: "uppercase" }}>
                {title}
              </div>
              {quote ? (
                <div style={{ display: "flex", fontSize: 32, lineHeight: 1.3, fontStyle: "italic", maxWidth: 900, opacity: 0.9 }}>
                  “{quote.length > 120 ? quote.slice(0, 118) + "…" : quote}”
                </div>
              ) : null}
            </div>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, textTransform: "uppercase" }}>{site}</div>
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}
