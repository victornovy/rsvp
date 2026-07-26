import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "rsvp.";
  const eyebrow = searchParams.get("eyebrow");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#3F1832",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(226,85,31,0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(108,47,88,0.65), transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            fontStyle: "italic",
            marginBottom: 28,
          }}
        >
          rsvp.
        </div>
        {eyebrow && (
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#E2551F",
              textTransform: "uppercase",
              letterSpacing: 4,
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 60,
            color: "white",
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 940,
          }}
        >
          {title}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
