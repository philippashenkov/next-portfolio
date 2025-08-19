"use client";

import React from "react";

type CursorStyle = "block" | "bar" | "underscore";

export interface TypewriterProps {
  lines: string[];
  speedMsPerChar?: number; // lower is faster
  lineDelayMs?: number; // delay between lines
  startDelayMs?: number;
  cursorStyle?: CursorStyle;
  className?: string;
  lineClassName?: string;
  // Optional end-of-text signature shown after typing completes
  showEndSignature?: boolean;
  endSignature?: string;
  endSignatureDelayMs?: number;
}

const cursorGlyph: Record<CursorStyle, string> = {
  block: "\u258B", // ▋
  bar: "|",
  underscore: "_",
};

export const Typewriter: React.FC<TypewriterProps> = ({
  lines,
  speedMsPerChar = 8, // super fast
  lineDelayMs = 150,
  startDelayMs = 150,
  cursorStyle = "block",
  className,
  lineClassName,
  showEndSignature = true,
  endSignature = "EOF",
  endSignatureDelayMs = 200,
}) => {
  const [typed, setTyped] = React.useState<string[]>(() => Array(lines.length).fill(""));
  const [done, setDone] = React.useState(false);
  const [activeLine, setActiveLine] = React.useState(0);
  const [sigShown, setSigShown] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    async function typeAll() {
      if (prefersReduced) {
        // Render everything at once; still show blinking cursor.
        if (!cancelled) {
          setTyped([...lines]);
          setDone(true);
          if (showEndSignature) {
            setTimeout(() => !cancelled && setSigShown(true), endSignatureDelayMs);
          }
        }
        return;
      }

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await sleep(startDelayMs);

      for (let i = 0; i < lines.length && !cancelled; i++) {
        setActiveLine(i);
        const target = lines[i];
        let out = "";
        for (let c = 0; c < target.length && !cancelled; c++) {
          out += target[c];
          setTyped((prev) => {
            const next = [...prev];
            next[i] = out;
            return next;
          });
          // small jitter for more organic feel
          const jitter = (c % 7 === 0) ? 3 : 0;
          await sleep(Math.max(1, speedMsPerChar - jitter));
        }
        if (i < lines.length - 1) {
          await sleep(lineDelayMs);
        }
      }
      if (!cancelled) {
        setDone(true);
        if (showEndSignature) {
          setTimeout(() => !cancelled && setSigShown(true), endSignatureDelayMs);
        }
      }
    }

    typeAll();
    return () => {
      cancelled = true;
    };
  }, [lines, speedMsPerChar, lineDelayMs, startDelayMs, showEndSignature, endSignatureDelayMs]);

  const cursor = cursorGlyph[cursorStyle];

  return (
    <div className={className} style={{ position: "relative" }}>
      <style>{`
        @keyframes tw-blink { 0%, 45% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .tw-cursor { display: inline-block; margin-left: 2px; animation: tw-blink 1s steps(2, start) infinite; }
      `}</style>
      {typed.map((text, i) => (
        <div key={i} className={lineClassName} style={{ whiteSpace: "pre-wrap" }}>
          {text}
          {i === activeLine && !sigShown ? (
            <span aria-hidden className="tw-cursor">{cursor}</span>
          ) : null}
        </div>
      ))}
      {sigShown && (
        <div className={(lineClassName ? lineClassName + " " : "") + "tw-end"} style={{ whiteSpace: "pre-wrap" }}>
          {endSignature} <span aria-hidden className="tw-cursor">{cursor}</span>
        </div>
      )}
      {/* When not yet started, ensure correct layout height */}
      {typed.length === 0 && <div className={lineClassName}>&nbsp;</div>}
      {/* Hide cursor until something exists to place it after */}
      {!done && typed.every((t) => t.length === 0) ? null : null}
    </div>
  );
};

export default Typewriter;
