import { useRef, useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import html2pdf from "html2pdf.js";
import "katex/dist/katex.min.css";
import "./Preview.css";
import { MermaidDiagram, renderMermaidLight } from "./MermaidDiagram";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.warn("Copy to clipboard failed");
      }
    }
  };
  return (
    <button
      className={`code-copy-btn ${copied ? "copied" : ""}`}
      onClick={handleCopy}
      title="Copy code"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function extractTitle(content) {
  if (!content) return "notes";
  const match = content.match(/^#{1,3}\s+(.+)$/m);
  if (!match) return "notes";
  return (
    match[1]
      .trim()
      .replace(/\*\*/g, "")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .substring(0, 100) || "notes"
  );
}

function Preview({ content, expanded, onToggleExpand, darkMode, style }) {
  const previewRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    const element = previewRef.current;
    if (!element || isGenerating) return;
    setIsGenerating(true);

    const pdfTitle = extractTitle(content);

    // ── Theme palette ──
    const T = {
      h1: "#1a2e6b", h2: "#005a8a", h3: "#005a8a", h4: "#111827",
      body: "#1a1a1a", strong: "#000000", muted: "#4b5563",
      codeBg: "#eef2f7", codeText: "#9f1239", codeBdr: "#d1d5db",
      bqBg: "#f0f7ff", bqBdr: "#1a2e6b", tblHdr: "#1a2e6b",
      link: "#1a2e6b", border: "#e5e7eb",
    };

    // ── Clone the preview DOM ──
    const clone = element.cloneNode(true);
    // Unique id so the styles injected below only ever affect this
    // offscreen clone, never the live page sitting behind it.
    clone.id = "pdf-export-clone";
    // NOTE: We do NOT add .pdf-rendering class — all styles are inline.
    // This avoids all CSS !important conflicts.

    const W = 718; // content width in px for A4, matching the 10mm margins below (190mm usable width)

    // ── Inject <style> to suppress text-selection highlights during capture ──
    // Scoped to #pdf-export-clone: a bare `*` selector here would apply to
    // the whole live document for the duration of the export (a <style>
    // tag's rules are global no matter where in the DOM it's inserted),
    // which briefly made text unselectable across the entire app while a
    // PDF was generating.
    const sty = document.createElement("style");
    sty.textContent = [
      "#pdf-export-clone, #pdf-export-clone *, #pdf-export-clone *::before, #pdf-export-clone *::after {",
      "  -webkit-user-select:none!important; user-select:none!important;",
      "  -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important;",
      "}",
      "#pdf-export-clone *::selection, #pdf-export-clone *::-moz-selection {",
      "  background:transparent!important; color:inherit!important;",
      "}",
    ].join("\n");
    clone.prepend(sty);

    // ── Set CSS variables as fallback for any elements we don't inline-style ──
    const vars = {
      "--bg-primary": "#fff", "--bg-secondary": "#fafbfc", "--bg-tertiary": "#f3f4f6",
      "--text-primary": "#1f2937", "--text-secondary": T.body, "--text-muted": "#9ca3af",
      "--border-color": T.border, "--accent-color": T.h1,
      "--heading-h1": T.h1, "--heading-h2": T.h2, "--heading-h3": T.h3, "--heading-h4": T.h4,
      "--code-inline-bg": T.codeBg, "--code-inline-color": T.codeText,
      "--blockquote-bg": T.bqBg, "--blockquote-border": T.bqBdr, "--blockquote-text": T.body,
      "--table-header-bg": T.tblHdr, "--table-even-row": "#f8f9fc", "--table-hover-row": "#f0f1f5",
      "--strong-color": T.strong, "--link-color": T.link,
      "--shadow-light": "none", "--shadow-medium": "none", "--shadow-heavy": "none",
    };
    Object.entries(vars).forEach(([k, v]) => clone.style.setProperty(k, v));

    // ── Root container ──
    clone.style.cssText += `;width:${W}px;max-width:${W}px;padding:4px 6px;box-sizing:border-box;overflow:visible;opacity:1;background:#fff;color:${T.body};font-family:"Open Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.75`;

    // ── Strip layout-breaking inline styles from all children ──
    clone.querySelectorAll("*").forEach(el => {
      for (const p of ["overflow", "overflow-x", "overflow-y", "min-width", "max-width", "width", "transition", "animation", "transform", "box-shadow"])
        el.style.removeProperty(p);
      // Force full opacity everywhere. Whatever the source (a lingering
      // fade-in animation state, an inherited "muted" class, anything),
      // a static exported PDF should never show washed-out "ghost" text.
      el.style.setProperty("opacity", "1", "important");
    });

    // ── Prevent page-break text clipping ──
    // html2pdf can slice an element mid-line at page boundaries, causing
    // clipped text at the bottom of one page and duplicated/clipped text
    // at the top of the next. Setting break-inside:avoid on block elements
    // tells html2pdf to push the whole block to the next page instead.
    clone.querySelectorAll("p, li, blockquote, h1, h2, h3, h4, h5, h6, .code-block-wrapper, .table-wrapper, .flowchart-wrapper").forEach(el => {
      el.style.breakInside = "avoid";
      el.style.pageBreakInside = "avoid"; // legacy fallback
    });
    // Keep headings attached to the content that follows them
    clone.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
      el.style.breakAfter = "avoid";
      el.style.pageBreakAfter = "avoid";
    });

    // ════════════════════════════════════
    //  INLINE STYLE EVERY ELEMENT TYPE
    // ════════════════════════════════════

    // Headings
    clone.querySelectorAll("h1").forEach(h => {
      h.style.cssText = `color:${T.h1};border-left:5px solid ${T.h1};padding-left:16px;margin:0 0 22px 0;font-size:26px;font-weight:800;line-height:1.3;letter-spacing:-0.01em`;
    });
    clone.querySelectorAll("h2").forEach(h => {
      h.style.cssText = `color:${T.h2};border-left:4px solid ${T.h2};padding-left:14px;margin:28px 0 12px 0;font-size:19px;font-weight:700;line-height:1.35`;
    });
    clone.querySelectorAll("h3").forEach(h => {
      h.style.cssText = `color:${T.h3};border-left:3px solid ${T.h3};padding-left:12px;margin:24px 0 10px 0;font-size:17px;font-weight:700;line-height:1.35`;
    });
    clone.querySelectorAll("h4").forEach(h => {
      h.style.cssText = `color:${T.h4};margin:18px 0 8px 0;font-size:15px;font-weight:700;line-height:1.4`;
    });
    clone.querySelectorAll("h5,h6").forEach(h => {
      h.style.cssText = `color:${T.muted};font-weight:600`;
    });

    // Body text
    clone.querySelectorAll("p").forEach(el => {
      el.style.color = T.body;
      el.style.fontSize = "13.5px";
      el.style.lineHeight = "1.75";
      el.style.marginBottom = "12px";
      el.style.overflow = "visible";
      // A paragraph that's just a single bold run is almost always being
      // used as an informal sub-heading (e.g. "**Phase 2: ...**" on its own
      // line). Keep it attached to whatever comes right after it so it
      // can't get stranded alone at the bottom of a page.
      const isBoldOnly =
        el.childNodes.length === 1 &&
        el.firstElementChild &&
        el.firstElementChild.tagName === "STRONG";
      if (isBoldOnly) {
        el.style.breakAfter = "avoid";
        el.style.pageBreakAfter = "avoid";
      }
    });
    clone.querySelectorAll("li").forEach(el => {
      el.style.color = T.body;
      el.style.fontSize = "13.5px";
      el.style.lineHeight = "1.7";
      el.style.marginBottom = "4px";
      el.style.overflow = "visible";
      el.style.position = "relative";
    });
    clone.querySelectorAll("ul,ol").forEach(el => {
      el.style.overflow = "visible";
      el.style.paddingLeft = "22px";
    });
    // html2canvas doesn't reliably paint native <ul> markers (::marker /
    // list-style-type) — they end up as tiny, raised, malformed tick marks
    // instead of proper round bullets. Numbered <ol> markers render fine, so
    // only unordered lists need this: disable the native marker and draw a
    // real bullet character as ordinary inline content instead.
    // Task lists (checkbox items) are skipped — they already suppress their
    // own marker and use a negative margin tuned for the original padding,
    // so changing that here would misalign the checkboxes.
    clone.querySelectorAll("ul").forEach(el => {
      if (el.querySelector(".task-list-item")) return;
      el.style.listStyle = "none";
      el.style.paddingLeft = "6px";
    });
    clone.querySelectorAll("ul > li").forEach(el => {
      if (el.classList.contains("task-list-item")) return;
      el.style.position = "relative";
      el.style.paddingLeft = "16px";
      const bullet = document.createElement("span");
      bullet.textContent = "\u2022";
      bullet.style.cssText = `position:absolute;left:2px;top:0;color:${T.body}`;
      el.prepend(bullet);
    });

    // Bold / italic / links
    clone.querySelectorAll("strong").forEach(el => {
      el.style.fontWeight = "700";
      el.style.color = T.strong;
    });
    clone.querySelectorAll("h1 strong").forEach(el => el.style.color = T.h1);
    clone.querySelectorAll("h2 strong").forEach(el => el.style.color = T.h2);
    clone.querySelectorAll("h3 strong").forEach(el => el.style.color = T.h3);
    clone.querySelectorAll("h4 strong").forEach(el => el.style.color = T.h4);

    clone.querySelectorAll("em").forEach(el => {
      el.style.fontStyle = "italic";
      el.style.color = T.body;
    });
    clone.querySelectorAll("a").forEach(el => {
      el.style.color = T.link;
      el.style.textDecoration = "underline";
      el.style.borderBottom = "none";
    });

    // Inline code — keep nowrap so html2canvas doesn't paint the code
    // background as a single bounding-box rectangle when the element wraps
    // across lines (a known html2canvas limitation). The original text-
    // clipping bug was caused by the broad "code" tag selector applying
    // overflow:hidden; that's been fixed separately, so nowrap is safe.
    clone.querySelectorAll(".inline-code").forEach(el => {
      el.style.cssText = `background:${T.codeBg};color:${T.codeText};border:1px solid ${T.codeBdr};border-radius:4px;padding:1px 5px;font-family:"Fira Code","Consolas",monospace;font-size:0.82em;font-weight:400;display:inline;white-space:nowrap;overflow:visible`;
    });

    // ── Code blocks — light theme for study notes ──────────────────────────
    // A dark block on a white page is jarring when printed / reading as a PDF.
    // GitHub Light palette: soft off-white background, muted professional
    // syntax colors that read clearly both on screen and on paper.

    clone.querySelectorAll(".code-block-wrapper").forEach(el => {
      el.style.cssText = [
        "overflow:hidden",
        "border-radius:8px",
        "max-width:100%",
        "border:1.5px solid #d0d7de",
        "margin:14px 0",
        "background:#f6f8fa",
        "box-shadow:0 1px 3px rgba(0,0,0,0.07)",
        "transform:none",
      ].join(";");
    });

    // Header bar — slightly darker than the body, clean separator
    clone.querySelectorAll(".code-block-header").forEach(el => {
      el.style.cssText = [
        "display:flex",
        "align-items:center",
        "justify-content:space-between",
        "padding:5px 14px",
        "background:#eaeef2",
        "border-bottom:1px solid #d0d7de",
        "border-radius:0",
      ].join(";");
    });

    // Language badge pill instead of plain text
    clone.querySelectorAll(".code-block-lang").forEach(el => {
      el.style.cssText = [
        "font-size:10px",
        "color:#57606a",
        "background:#dde1e6",
        "border-radius:20px",
        "padding:1px 8px",
        "text-transform:uppercase",
        "letter-spacing:0.5px",
        "font-weight:700",
        "font-family:\"Inter\",sans-serif",
      ].join(";");
    });

    // Mac dots — keep them as a visual cue (neutral colors for print)
    clone.querySelectorAll(".code-window-controls").forEach(el => {
      el.style.cssText = "display:flex;gap:5px;align-items:center";
    });
    clone.querySelectorAll(".mac-dot").forEach(el => {
      el.style.cssText = "width:8px;height:8px;border-radius:50%;display:inline-block";
    });
    clone.querySelectorAll(".mac-close").forEach(el => { el.style.background = "#f78166"; });
    clone.querySelectorAll(".mac-minimize").forEach(el => { el.style.background = "#d4a72c"; });
    clone.querySelectorAll(".mac-maximize").forEach(el => { el.style.background = "#57ab5a"; });

    // Hide copy button (useless on paper)
    clone.querySelectorAll(".code-copy-btn").forEach(el => el.style.display = "none");

    // Code content — wrapping + compact mono sizing
    clone.querySelectorAll("pre,.code-block,.code-block > div,.code-block-wrapper code").forEach(el => {
      el.style.whiteSpace = "pre-wrap";
      el.style.wordBreak = "break-word";
      el.style.overflowWrap = "break-word";
      el.style.overflow = "hidden";
      el.style.maxWidth = "100%";
      el.style.fontSize = "11.5px";
      el.style.lineHeight = "1.5";
      el.style.fontFamily = '"Fira Code","Consolas","Monaco",monospace';
    });

    // Padding on the code content area
    clone.querySelectorAll(".code-block").forEach(el => {
      el.style.setProperty("padding", "12px 16px", "important");
      el.style.setProperty("margin", "0", "important");
    });

    // Ensure the inner containers fill 100% width
    clone.querySelectorAll(".code-block,.code-block > div").forEach(el => {
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
    });

    // ── Remap syntax-highlighter token colors to a light theme ──────────────
    //
    // WHY COLOR-VALUE MAPPING?
    // react-syntax-highlighter with `useInlineStyles: true` (the default)
    // **strips** the token-type CSS classes (keyword, string, etc.) from the
    // rendered spans — only "token" is kept. Colors are applied exclusively
    // via inline `style`. So we cannot use classList to identify token types.
    //
    // Instead we:
    //   1. Read each span's current inline `color` (an RGB string set by oneDark)
    //   2. Normalize it to "r,g,b" for reliable lookup
    //   3. Map it to the corresponding GitHub-Light color

    // Convert any CSS color string to a normalised "r,g,b" key.
    // Handles both "rgb(r, g, b)" and "hsl(…)" forms (the browser usually
    // stores the computed value as rgb, but we handle hsl just in case).
    function colorToRGBKey(c) {
      if (!c) return null;
      c = c.trim();
      const rgb = c.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (rgb) return `${rgb[1]},${rgb[2]},${rgb[3]}`;
      return null; // can't parse — leave as default
    }

    // oneDark HSL values → browser RGB → light-theme hex.
    // Generated by converting each HSL from the oneDark theme to RGB:
    //   hsl(286,60%,67%) → rgb(198,120,221) — keyword
    //   hsl(95,38%,62%)  → rgb(152,195,121) — string / builtin / char / regex
    //   hsl(207,82%,66%) → rgb(97,175,239)  — function / variable / operator
    //   hsl(29,54%,61%)  → rgb(209,154,102) — number / class-name / boolean
    //   hsl(355,65%,65%) → rgb(224,108,117) — property / tag / symbol / deleted
    //   hsl(220,10%,40%) → rgb(92,99,112)   — comment
    //   hsl(220,14%,71%) → rgb(171,178,191) — default text / punctuation / entity
    //   hsl(187,47%,55%) → rgb(86,182,194)  — url
    //   hsl(5,48%,51%)   → rgb(190,80,70)   — interpolation-punctuation
    const DARK_TO_LIGHT = {
      "198,120,221": { color: "#0550ae" },                 // keyword → navy
      "152,195,121": { color: "#116329" },                 // string/builtin → forest green
      "97,175,239":  { color: "#8250df" },                 // function/variable → purple
      "209,154,102": { color: "#953800" },                 // number/class-name → rust
      "224,108,117": { color: "#cf222e" },                 // property/tag → crimson
      "92,99,112":   { color: "#6e7781", italic: true },   // comment → muted slate
      "171,178,191": { color: "#24292f" },                 // default/punctuation → near-black
      "86,182,194":  { color: "#0550ae" },                 // url → navy
      "190,80,70":   { color: "#cf222e" },                 // interpolation → crimson
    };

    clone.querySelectorAll(".code-block-wrapper span").forEach(el => {
      const key = colorToRGBKey(el.style.color);
      const mapping = key && DARK_TO_LIGHT[key];
      if (mapping) {
        el.style.color = mapping.color;
        if (mapping.italic) el.style.fontStyle = "italic";
      } else {
        // Unmapped or no inline color → default near-black
        el.style.color = "#24292f";
      }
      // Remove dark text-shadow from oneDark
      el.style.textShadow = "none";
    });

    // Background of all internal wrapper divs → transparent so the
    // wrapper's #f6f8fa shows through with no double-box artifact.
    clone.querySelectorAll(".code-block, .code-block > div, .code-block code, .code-block pre").forEach(el => {
      el.style.setProperty("background", "transparent", "important");
      el.style.textShadow = "none";
    });

    // Blockquotes
    clone.querySelectorAll("blockquote").forEach(el => {
      el.style.cssText = `border-left:4px solid ${T.bqBdr};background:${T.bqBg};color:${T.body};border-radius:0 6px 6px 0;padding:12px 18px;margin:14px 0;font-style:italic`;
    });
    clone.querySelectorAll("blockquote p").forEach(el => el.style.color = T.body);

    // Tables
    clone.querySelectorAll(".table-wrapper").forEach(el => {
      el.style.cssText = `overflow:hidden;border-radius:6px;border:1px solid ${T.border};margin:14px 0;box-shadow:none`;
    });
    clone.querySelectorAll("thead").forEach(el => el.style.backgroundColor = T.tblHdr);
    clone.querySelectorAll("th").forEach(el => {
      el.style.cssText = "color:#fff;font-weight:700;font-size:12px;padding:8px 14px;word-break:break-word;overflow-wrap:break-word";
    });
    clone.querySelectorAll("td").forEach(el => {
      el.style.cssText = `font-size:13px;padding:7px 14px;border-bottom:1px solid ${T.border};word-break:break-word;overflow-wrap:break-word`;
    });

    // HR, images
    clone.querySelectorAll("hr").forEach(el => {
      el.style.cssText = `border:none;height:1px;background:${T.border};margin:24px 0`;
    });
    clone.querySelectorAll("img").forEach(el => {
      el.style.cssText = "max-width:100%;border-radius:4px;box-shadow:none;margin:10px 0";
    });

    // ── Mount off-screen ──
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `position:fixed;left:-10000px;top:0;width:${W}px;background:#fff;z-index:-1`;
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 300));

    try {
      // ── Wait for every image in the clone to finish loading ──
      // cloneNode copies <img> tags as-is; if one hadn't finished loading
      // yet (or was still decoding) at the moment we cloned, html2canvas
      // would capture it as blank. Most images are already cached from the
      // live preview, so this typically resolves immediately.
      const imgs = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            })
        )
      );

      // ── Re-render Mermaid diagrams in the light theme ──
      // A diagram rendered while the app is in dark mode uses light
      // lines/text meant to sit on a dark canvas. Cloned as-is onto a white
      // PDF page, it can wash out or become unreadable. Re-render each
      // diagram from its original source using mermaid's "default" (light)
      // theme so it stays legible regardless of the app's current theme.
      const mermaidContainers = clone.querySelectorAll(
        ".mermaid-container[data-mermaid-source]"
      );
      for (const container of mermaidContainers) {
        const source = container.getAttribute("data-mermaid-source");
        if (!source) continue;
        try {
          const svg = await renderMermaidLight(source);
          container.innerHTML = svg;
          const svgEl = container.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        } catch (mermaidErr) {
          // Keep whatever was already cloned rather than failing the export.
          console.warn("Falling back to already-rendered diagram for PDF:", mermaidErr);
        }
      }

      const pdf = await html2pdf()
        .set({
          margin: [10, 10, 10, 10], // top, right, bottom, left (mm)
          filename: `${pdfTitle}.pdf`,
          image: { type: "jpeg", quality: 1 },
          html2canvas: {
            scale: 4,
            useCORS: true,
            letterRendering: true,
            logging: false,
            width: W,
            windowWidth: W,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: "#ffffff",
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(clone)
        .toPdf()
        .get("pdf");

      // ── Add header + footer to every page ──
      const pages = pdf.internal.getNumberOfPages();
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      for (let i = 1; i <= pages; i++) {
        pdf.setPage(i);
        // Header — title in top-right corner + separator line, mirroring
        // the footer below. Skipped on page 1: the full title is already
        // right there in the content, so repeating it in small print above
        // it just added clutter (and wasted margin).
        if (i !== 1) {
          pdf.setFontSize(8);
          pdf.setTextColor(180, 180, 180);
          pdf.text(pdfTitle, pw - 10, 7, { align: "right" });
          pdf.setDrawColor(210, 210, 210);
          pdf.setLineWidth(0.3);
          pdf.line(10, 9, pw - 10, 9);
        }
        // Footer — separator line + page number
        const fy = ph - 5;
        pdf.setDrawColor(210, 210, 210);
        pdf.setLineWidth(0.3);
        pdf.line(10, fy - 4, pw - 10, fy - 4);
        pdf.setFontSize(8);
        pdf.setTextColor(170, 170, 170);
        pdf.text(`Page ${i} of ${pages}`, pw / 2, fy, { align: "center" });
      }

      pdf.save(`${pdfTitle}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      try { document.body.removeChild(wrapper); } catch { /* already removed */ }
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`preview ${expanded ? "preview-expanded" : ""}`}
      style={style}
    >
      <div className="preview-header">
        <div className="preview-header-left">
          <div className="preview-title-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span className="preview-title">Preview</span>
        </div>
        <div className="preview-actions">
          <button
            className={`download-btn ${isGenerating ? "generating" : ""}`}
            onClick={handleDownloadPDF}
            disabled={!content || isGenerating}
            title="Download as PDF"
          >
            {isGenerating ? (
              <>
                <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF
              </>
            )}
          </button>
          <button
            className="header-icon-btn expand-btn"
            onClick={onToggleExpand}
            title={expanded ? "Exit fullscreen" : "Fullscreen preview"}
          >
            {expanded ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="preview-content" ref={previewRef}>
        {content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              pre({ children }) {
                return <>{children}</>;
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");

                if (match && (match[1] === "flowchart" || match[1] === "mermaid")) {
                  return (
                    <div className="flowchart-wrapper">
                      <MermaidDiagram content={codeString} isDark={darkMode} />
                    </div>
                  );
                }

                if (match || codeString.includes("\n")) {
                  const lang = match ? match[1] : "text";
                  return (
                    <div className="code-block-wrapper">
                      <div className="code-block-header">
                        <div className="code-window-controls">
                          <span className="mac-dot mac-close"></span>
                          <span className="mac-dot mac-minimize"></span>
                          <span className="mac-dot mac-maximize"></span>
                        </div>
                        <span className="code-block-lang">{lang}</span>
                        <CopyButton text={codeString} />
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={lang}
                        PreTag="div"
                        className="code-block"
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
                return (
                  <code className={`inline-code ${className || ""}`} {...props}>
                    {children}
                  </code>
                );
              },
              table({ children }) {
                return (
                  <div className="table-wrapper">
                    <table>{children}</table>
                  </div>
                );
              },
              input({ type, checked, ...props }) {
                if (type === "checkbox") {
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="task-checkbox"
                      {...props}
                    />
                  );
                }
                return <input type={type} {...props} />;
              },
              li({ children, className, ...props }) {
                const isTask = className === "task-list-item";
                return (
                  <li
                    className={isTask ? "task-list-item" : undefined}
                    {...props}
                  >
                    {children}
                  </li>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <div className="preview-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h2>Your notes will appear here</h2>
              <p>Start typing in the editor to see a live preview.</p>
              <div className="placeholder-features">
                <div className="placeholder-feature">
                  <div className="feature-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                  <strong>Code</strong>
                  <span>Syntax-highlighted blocks</span>
                </div>
                <div className="placeholder-feature">
                  <div className="feature-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" />
                      <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                  </div>
                  <strong>Math</strong>
                  <span>LaTeX formulas</span>
                </div>
                <div className="placeholder-feature">
                  <div className="feature-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <strong>Tables</strong>
                  <span>Formatted data</span>
                </div>
                <div className="placeholder-feature">
                  <div className="feature-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <strong>Tasks</strong>
                  <span>Checkbox lists</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Preview);