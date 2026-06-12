import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AVAULT — A vault for judgment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e3120b",
        }}
      >
        <div style={{ color: "#fff", fontSize: 130, fontWeight: 800, letterSpacing: -2, fontFamily: "Arial, sans-serif" }}>
          AVAULT
        </div>
        <div style={{ marginTop: 18, color: "rgba(255,255,255,0.9)", fontSize: 34, letterSpacing: 6, fontFamily: "Arial, sans-serif" }}>
          A VAULT FOR JUDGMENT · ONE VERDICT AT A TIME
        </div>
        <div style={{ marginTop: 30, color: "rgba(255,255,255,0.75)", fontSize: 26, fontFamily: "Georgia, serif" }}>
          Daily political-ethical verdicts by Wonwoo Yoon
        </div>
      </div>
    ),
    size
  );
}
