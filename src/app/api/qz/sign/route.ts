import { createSign } from "node:crypto";

export const runtime = "nodejs";

type SignRequestBody = {
  request?: unknown;
};

function normalizePem(value: string) {
  return value.replaceAll("\\n", "\n");
}

export async function POST(request: Request) {
  const privateKey = process.env.QZ_TRAY_PRIVATE_KEY;

  if (!privateKey?.trim()) {
    return new Response("QZ_TRAY_PRIVATE_KEY is not configured.", { status: 500 });
  }

  let body: SignRequestBody;
  try {
    body = await request.json() as SignRequestBody;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  if (typeof body.request !== "string" || !body.request) {
    return new Response("Missing QZ signing request.", { status: 400 });
  }

  try {
    const signer = createSign("RSA-SHA512");
    signer.update(body.request, "utf8");
    signer.end();

    return new Response(signer.sign(normalizePem(privateKey), "base64"), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "QZ signing failed.";
    return new Response(message, { status: 500 });
  }
}
