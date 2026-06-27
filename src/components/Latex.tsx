import katex from "katex";
import "katex/dist/katex.min.css";
import { splitMathText } from "../lib/mathText";

type Props = {
  value: string;
  block?: boolean;
  className?: string;
};

export function Latex({ value, block = false, className }: Props) {
  const html = katex.renderToString(value, {
    throwOnError: false,
    displayMode: block,
    strict: "ignore",
  });
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
      aria-label={value.replace(/\\/g, "")}
    />
  );
}

type MathTextProps = {
  value: string;
  className?: string;
};

export function MathText({ value, className }: MathTextProps) {
  return (
    <span className={className}>
      {splitMathText(value).map((part, index) =>
        part.kind === "math" ? (
          <Latex key={`${part.value}-${index}`} value={part.value} />
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        ),
      )}
    </span>
  );
}
