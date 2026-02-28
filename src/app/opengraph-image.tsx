import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoPath = path.join(process.cwd(), "public", "icone.png");
  const logoBuffer = await readFile(logoPath);
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 12% 10%, rgba(190,24,93,0.34), transparent 34%), radial-gradient(circle at 86% 6%, rgba(37,99,235,0.34), transparent 38%), linear-gradient(180deg, #0b0b0f 0%, #0f111a 45%, #111827 100%)",
          color: "#f8fafc",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(244,63,94,0.12), rgba(245,158,11,0.07), rgba(59,130,246,0.1))",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "54px 58px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                width: 78,
                height: 78,
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoDataUrl} alt="MovieDataX" width={78} height={78} />
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: 2,
                fontWeight: 700,
                color: "rgba(254,205,211,0.95)",
                textTransform: "uppercase",
              }}
            >
              Plataforma para cinéfilos
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: "86%" }}>
            <div
              style={{
                display: "flex",
                fontSize: 88,
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: -1.4,
                backgroundImage:
                  "linear-gradient(120deg, #fecdd3 0%, #ffffff 52%, #bae6fd 100%)",
                color: "transparent",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              MovieDataX
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 38,
                lineHeight: 1.15,
                fontWeight: 700,
                color: "#e2e8f0",
              }}
            >
              Descubra o próximo filme que vai te marcar — tendências, premiações e recomendações inteligentes em um só lugar.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 25,
              color: "rgba(248,250,252,0.88)",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#fb7185" }}>●</span>
            <span>Top títulos</span>
            <span style={{ color: "#38bdf8" }}>●</span>
            <span>Premiações</span>
            <span style={{ color: "#f59e0b" }}>●</span>
            <span>Busca inteligente</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
