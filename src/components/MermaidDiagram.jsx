import { useEffect, useRef } from "react";
import mermaid from "mermaid";

let currentTheme = null;

export function MermaidDiagram({ content, isDark }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      // Guard: skip render entirely if content is empty or whitespace-only
      if (!content || !content.trim()) {
        containerRef.current.innerHTML = `<div class="mermaid-error">⚠ Empty diagram — no content to render.</div>`;
        return;
      }

      try {
        // Re-initialize mermaid whenever the theme changes
        const desiredTheme = isDark ? "dark" : "default";
        if (currentTheme !== desiredTheme) {
          mermaid.initialize({
            startOnLoad: false,
            theme: desiredTheme,
            securityLevel: "loose",
          });
          currentTheme = desiredTheme;
        }

        // Clear BEFORE render so Mermaid's own error SVG never gets a chance
        // to settle into the DOM (which causes the bomb icon in PDFs)
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Create a unique ID for this diagram
        const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(uniqueId, content);

        // Double-check containerRef still exists before setting innerHTML
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.maxWidth = "100%";
            svgElement.style.height = "auto";
          }
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        // Replace any partial/error SVG Mermaid may have injected with a
        // clean text message — this is what prints in PDF instead of the bomb
        if (containerRef.current) {
          containerRef.current.innerHTML =
            `<div class="mermaid-error">` +
            `<strong>⚠ Diagram syntax error</strong><br/>` +
            `<code style="font-size:0.8em;opacity:0.7">${(error.message || String(error)).split('\n')[0]}</code>` +
            `</div>`;
        }
      }
    };

    renderDiagram();
  }, [content, isDark]);

  return (
    <div
      ref={containerRef}
      className="mermaid-container"
      data-mermaid-source={content}
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "1em 0",
        overflowX: "auto",
      }}
    />
  );
}

// Renders Mermaid source using the light "default" theme, regardless of
// which theme the app currently has active, then restores the previous
// theme so any live diagrams on screen keep rendering correctly.
//
// Used by PDF export: diagrams always sit on a white printed page, so a
// diagram rendered in the app's dark theme (light lines/text meant for a
// dark canvas) would be washed out or invisible there.
export async function renderMermaidLight(sourceCode) {
  const previousTheme = currentTheme;

  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
  });
  currentTheme = "default";

  const uniqueId = `mermaid-pdf-${Math.random().toString(36).substr(2, 9)}`;
  const { svg } = await mermaid.render(uniqueId, sourceCode);

  // Restore whatever theme was active before this call so subsequent
  // live re-renders (e.g. the user keeps editing) aren't affected.
  mermaid.initialize({
    startOnLoad: false,
    theme: previousTheme || "default",
    securityLevel: "loose",
  });
  currentTheme = previousTheme;

  return svg;
}