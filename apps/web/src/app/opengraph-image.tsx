import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "InternPrep AI — Day 1 Placement & Case Interview Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle decorative radial glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(9, 9, 11, 0) 70%)",
          }}
        />

        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1.5px solid rgba(16, 185, 129, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            &gt;_
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: "32px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
            <span>InternPrep</span>
            <span style={{ color: "#10b981" }}>.ai</span>
          </div>
        </div>

        {/* Main Headline & Badge */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "6px 16px",
              borderRadius: "9999px",
              width: "fit-content",
              color: "#34d399",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Day 1 Placement & Case Interview Simulator
          </div>

          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#fafafa",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              maxWidth: "1000px",
            }}
          >
            Master Elite Case Interviews & Benchmark Your Resume
          </div>

          <div
            style={{
              fontSize: "22px",
              color: "#a1a1aa",
              lineHeight: 1.4,
              maxWidth: "920px",
            }}
          >
            Calibrated simulations across Consulting, SWE, Product, Analytics & Finance with real-time rubric feedback.
          </div>
        </div>

        {/* Footer Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "24px", color: "#71717a", fontSize: "16px", fontWeight: 500 }}>
            <span>• 5 Domain Engines</span>
            <span>• Action-Impact ATS Scoring</span>
            <span>• DPDPA 2023 Compliant</span>
          </div>
          <div style={{ color: "#10b981", fontSize: "18px", fontWeight: 700 }}>
            internprep.ai
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
