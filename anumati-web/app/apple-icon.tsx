import { ImageResponse } from "next/og";

/**
 * The home-screen icon. Apple's touch icon has to be a raster image, so this
 * is drawn to PNG at request time rather than served as the SVG the browser
 * favicon uses. No rounding and no transparency: iOS masks and backs it itself,
 * and a transparent icon comes out black.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#15365B",
          color: "#FFFFFF",
          fontSize: 116,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        A
      </div>
    ),
    size,
  );
}
