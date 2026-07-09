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
  };

  export default qz;
}
