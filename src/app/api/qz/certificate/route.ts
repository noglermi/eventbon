export const runtime = "nodejs";

export async function GET() {
  const certificate = process.env.QZ_TRAY_DIGITAL_CERTIFICATE;

  if (!certificate?.trim()) {
    return new Response("QZ_TRAY_DIGITAL_CERTIFICATE is not configured.", { status: 500 });
  }

  return new Response(certificate.replaceAll("\\n", "\n"), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
