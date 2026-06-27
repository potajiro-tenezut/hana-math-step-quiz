import katex from "katex";
import "katex/dist/katex.min.css";

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
