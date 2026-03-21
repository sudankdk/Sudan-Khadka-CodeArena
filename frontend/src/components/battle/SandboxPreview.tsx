import { useEffect, useRef, useMemo } from "react";

interface SandboxPreviewProps {
  html: string;
  css: string;
  js: string;
  className?: string;
  debounceMs?: number;
}

/**
 * SandboxPreview renders user HTML/CSS/JS in a sandboxed iframe using srcdoc.
 * Only `allow-scripts` is enabled — no access to parent origin.
 * Updates are debounced to avoid excessive re-renders during typing.
 */
export default function SandboxPreview({
  html,
  css,
  js,
  className = "",
  debounceMs = 300,
}: SandboxPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const srcdoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style>
</head>
<body>
${html}
<script>
// Capture console output and post to parent
(function() {
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;
  console.log = function(...args) {
    origLog.apply(console, args);
    window.parent.postMessage({ type: 'console', level: 'log', data: args.map(String).join(' ') }, '*');
  };
  console.error = function(...args) {
    origError.apply(console, args);
    window.parent.postMessage({ type: 'console', level: 'error', data: args.map(String).join(' ') }, '*');
  };
  console.warn = function(...args) {
    origWarn.apply(console, args);
    window.parent.postMessage({ type: 'console', level: 'warn', data: args.map(String).join(' ') }, '*');
  };
  window.onerror = function(message) {
    window.parent.postMessage({ type: 'console', level: 'error', data: String(message) }, '*');
  };
})();

try {
  ${js}
} catch(e) {
  console.error(e);
}
</script>
</body>
</html>`;
  }, [html, css, js]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = srcdoc;
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [srcdoc, debounceMs]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      title="Live Preview"
      className={`w-full h-full bg-white ${className}`}
      srcDoc={srcdoc}
    />
  );
}
