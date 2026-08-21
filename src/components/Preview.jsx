import { useRef, useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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

function safeUrlTransform(url) {
  const allowedProtocols = ["http:", "https:", "mailto:", "tel:", "id:", "data:"];
  const protocolMatch = url.match(/^([a-z0-9.+-]+):/i);
  if (protocolMatch) {
    if (allowedProtocols.includes(protocolMatch[1].toLowerCase() + ":")) {
      return url;
    }
    return "";
  }
  return url;
}

function Preview({ content, expanded, onToggleExpand, darkMode, style }) {
  const previewRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = () => {
    window.print();
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
            urlTransform={safeUrlTransform}
            components={{
              img({ src, alt, ...props }) {
                let finalSrc = src;
                if (src && src.startsWith("id:")) {
                  const imgId = src.replace("id:", "");
                  try {
                    const storedImages = JSON.parse(
                      localStorage.getItem("codestudynotes-images") || "{}"
                    );
                    finalSrc = storedImages[imgId] || src;
                  } catch (e) {
                    // fallback to original src on error
                  }
                }
                return <img src={finalSrc} alt={alt} {...props} />;
              },
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
                        showLineNumbers={true}
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