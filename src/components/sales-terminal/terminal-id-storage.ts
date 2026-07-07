const terminalIdStorageKey = "eventbon.terminalId.v1";

function createTerminalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "terminal-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export function readTerminalId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const storedValue = window.localStorage.getItem(terminalIdStorageKey);

    if (storedValue) {
      return storedValue;
    }

    const terminalId = createTerminalId();
    window.localStorage.setItem(terminalIdStorageKey, terminalId);
    return terminalId;
  } catch {
    return createTerminalId();
  }
}
