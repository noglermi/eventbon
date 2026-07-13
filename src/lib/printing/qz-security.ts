type QzSecurityApi = {
  security: {
    setCertificatePromise: (resolver: (resolve: (certificate: string) => void, reject: (reason?: unknown) => void) => void) => void;
    setSignatureAlgorithm: (algorithm: "SHA512" | "SHA1") => void;
    setSignaturePromise: (resolver: (toSign: string) => (resolve: (signature: string) => void, reject: (reason?: unknown) => void) => void) => void;
  };
};

let isQzSecurityConfigured = false;

function assertSuccessfulResponse(response: Response, context: string) {
  if (!response.ok) {
    throw new Error(`${context} failed with HTTP ${response.status}.`);
  }
}

async function fetchQzCertificate() {
  const response = await fetch("/api/qz/certificate", {
    cache: "no-store",
    headers: { Accept: "text/plain" },
  });
  assertSuccessfulResponse(response, "QZ certificate loading");
  const certificate = await response.text();
  if (!certificate.trim()) {
    throw new Error("QZ certificate is empty.");
  }
  return certificate;
}

async function fetchQzSignature(toSign: string) {
  const response = await fetch("/api/qz/sign", {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request: toSign }),
  });
  assertSuccessfulResponse(response, "QZ message signing");
  const signature = await response.text();
  if (!signature.trim()) {
    throw new Error("QZ signature is empty.");
  }
  return signature;
}

export function configureQzSecurity(qz: QzSecurityApi) {
  if (isQzSecurityConfigured) {
    return;
  }

  qz.security.setCertificatePromise((resolve, reject) => {
    fetchQzCertificate().then(resolve).catch(reject);
  });

  qz.security.setSignatureAlgorithm("SHA512");
  qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
    fetchQzSignature(toSign).then(resolve).catch(reject);
  });

  isQzSecurityConfigured = true;
}
