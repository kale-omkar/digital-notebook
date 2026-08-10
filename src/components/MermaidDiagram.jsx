import { useEffect, useRef } from "react";
import mermaid from "mermaid";

let currentTheme = null;

export function MermaidDiagram({ content, isDark }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

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

        // Clear previous content safely
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
        const errorMsg = error.message || String(error);
        // Only set error if container still exists
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="mermaid-error"><strong>⚠ Diagram Error</strong>\n\n${errorMsg}\n\n<span style="opacity:0.7">Tip: Check your mermaid syntax. Common issues:\n• Missing quotes around labels with special chars\n• Incorrect arrow syntax (use --> not ->)\n• Unclosed brackets or braces</span></div>`;
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