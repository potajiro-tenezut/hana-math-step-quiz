export type TextPart = {
  kind: "text" | "math";
  value: string;
};

export function splitMathText(value: string): TextPart[] {
  const parts: TextPart[] = [];
  let buffer = "";
  let mathRun = "";

  const flushText = () => {
    if (buffer) {
      parts.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  const flushMathRun = () => {
    if (!mathRun) return;
    const leading = mathRun.match(/^\s*/)?.[0] ?? "";
    const trailing = mathRun.match(/\s*$/)?.[0] ?? "";
    const core = mathRun.trim();
    if (core && shouldRenderInlineMath(core)) {
      if (leading) parts.push({ kind: "text", value: leading });
      flushText();
      parts.push({ kind: "math", value: normalizeInlineMath(core) });
      if (trailing) parts.push({ kind: "text", value: trailing });
    } else {
      buffer += mathRun;
    }
    mathRun = "";
  };

  for (const char of value) {
    if (isMathRunChar(char)) {
      mathRun += char;
    } else {
      flushMathRun();
      buffer += char;
    }
  }
  flushMathRun();
  flushText();
  return parts;
}

function isMathRunChar(char: string): boolean {
  return /[A-Za-z0-9\\^_{}=+\-*/×÷±√().,: ]/.test(char);
}

function shouldRenderInlineMath(value: string): boolean {
  if (value.length < 2) return false;
  return /\\|√|\^|=|[+\-*/×÷±]/.test(value) && /[A-Za-z0-9{}]/.test(value);
}

function normalizeInlineMath(value: string): string {
  return value.replace(/√([A-Za-z0-9]+)/g, "\\sqrt{$1}");
}
