import { ImageResponse } from "next/og";

/**
 * The card a link to this site unfurls into.
 *
 * Drawn rather than screenshotted, so it cannot go stale when the UI changes,
 * and it carries the two numbers that make the point on their own: 464 days
 * filed in series against 223 on the critical path. Both are labelled modelled,
 * because a preview card is exactly where an unqualified number gets quoted.
 */
export const runtime = "edge";
export const alt =
  "ANUMATI — every approval, in the order the law requires. 464 days filed in series against 223 on the critical path.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0F2A48 0%, #15365B 55%, #1D4470 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "#15365B",
            }}
          >
            A
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 8 }}>ANUMATI</div>
            <div style={{ fontSize: 20, color: "#9FC0DE", marginTop: 4 }}>
              Smart India Hackathon 2026 · SIH26130
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.15, maxWidth: 940 }}>
            Every approval, in the order the law requires
          </div>
          <div style={{ fontSize: 26, color: "#BBD3EA", marginTop: 20, maxWidth: 900 }}>
            A typed, cited dependency graph for industrial clearances in Maharashtra
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 17, color: "#8FB4D6", letterSpacing: 2 }}>FILED IN SERIES</div>
            <div style={{ fontSize: 60, fontWeight: 700, color: "#FFFFFF" }}>464 days</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 17, color: "#8FB4D6", letterSpacing: 2 }}>CRITICAL PATH</div>
            <div style={{ fontSize: 60, fontWeight: 700, color: "#8CCB4C" }}>223 days</div>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              marginBottom: 10,
              fontSize: 17,
              color: "#8FB4D6",
              maxWidth: 260,
              lineHeight: 1.4,
            }}
          >
            Modelled from notified time limits, not measured
          </div>
        </div>
      </div>
    ),
    size,
  );
}
