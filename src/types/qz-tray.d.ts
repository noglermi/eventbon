declare module "qz-tray" {
  type QzData = {
    type: "pixel" | "raw";
    format?: "html" | "plain" | "command";
    flavor?: "plain" | "base64" | "file";
    data: string;
  };

  type QzConfig = unknown;

  const qz: {
    websocket: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      isActive: () => boolean;
    };
    printers: {
      find: (query?: string) => Promise<string[] | string>;
    };
    configs: {
      create: (printer: string, options?: Record<string, unknown>) => QzConfig;
    };
    print: (config: QzConfig, data: QzData[]) => Promise<void>;
    security: {
      setCertificatePromise: (resolver: (resolve: (certificate: string) => void, reject: (reason?: unknown) => void) => void) => void;
      setSignatureAlgorithm: (algorithm: "SHA512" | "SHA1") => void;
      setSignaturePromise: (resolver: (toSign: string) => (resolve: (signature: string) => void, reject: (reason?: unknown) => void) => void) => void;
    };
  };

  export default qz;
}
