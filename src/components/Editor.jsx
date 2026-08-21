import { useRef, useEffect, useCallback, useMemo } from "react";
import "./Editor.css";

/* ─── Inline SVG Icons ─── */
const icons = {
  bold: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  strikethrough: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-3 3c0 2 1.5 3 4 3.5" />
      <path d="M8 20h7a3 3 0 0 0 3-3c0-2-1.5-3-4-3.5" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  ),
  code: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  codeBlock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <polyline points="9 8 5 12 9 16" />
      <polyline points="15 8 19 12 15 16" />
    </svg>
  ),
  link: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  image: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  list: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  orderedList: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">1</text>
      <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">2</text>
      <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">3</text>
    </svg>
  ),
  task: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 12l2 2 4-4" />
    </svg>
  ),
  quote: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 8c-1.1 0-2 .9-2 2v4h4v-4H9.5c0-1.7 1.3-3 3-3V5.5C9.7 5.5 7.5 7.2 7.5 10v6h5V10h-2.5zm8 0c-1.1 0-2 .9-2 2v4h4v-4h-2.5c0-1.7 1.3-3 3-3V5.5c-2.8 0-5 1.7-5 4.5v6h5V10H18z" />
    </svg>
  ),
  table: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  hr: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  sun: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  expand: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  collapse: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
};

function Editor({
  content,
  onChange,
  expanded,
  onToggleExpand,
  darkMode,
  onToggleDarkMode,
  style,
}) {
  const textareaRef = useRef(null);
  const contentRef = useRef(content);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const insertAtCursor = useCallback(
    (before, after = "", placeholder = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = contentRef.current;
      const selectedText = currentContent.substring(start, end);
      const text = selectedText || placeholder;

      const newText =
        currentContent.substring(0, start) +
        before +
        text +
        after +
        currentContent.substring(end);
      onChange(newText);

      const cursorPos = start + before.length + text.length;
      setTimeout(() => {
        textarea.focus();
        if (selectedText) {
          textarea.setSelectionRange(
            cursorPos + after.length,
            cursorPos + after.length,
          );
        } else {
          textarea.setSelectionRange(start + before.length, cursorPos);
        }
      }, 0);
    },
    [onChange],
  );

  const insertHeading = useCallback(
    (level) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = contentRef.current;
      const selectedText = currentContent.substring(start, end);
      const beforeText = currentContent.substring(0, start);
      const afterText = currentContent.substring(end);

      const lineStart = beforeText.lastIndexOf("\n") + 1;
      const beforeLine = beforeText.substring(lineStart);
      const headingPrefix = "#".repeat(level) + " ";

      let newText;
      let cursorPosition;

      if (selectedText) {
        newText = beforeText + headingPrefix + selectedText + afterText;
        cursorPosition = start + headingPrefix.length + selectedText.length;
      } else {
        if (beforeLine.trim() === "") {
          newText = beforeText + headingPrefix + afterText;
          cursorPosition = start + headingPrefix.length;
        } else {
          newText = beforeText + "\n" + headingPrefix + afterText;
          cursorPosition = start + headingPrefix.length + 1;
        }
      }

      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    },
    [onChange],
  );

  const insertBold = useCallback(
    () => insertAtCursor("**", "**", "bold text"),
    [insertAtCursor],
  );
  const insertItalic = useCallback(
    () => insertAtCursor("*", "*", "italic text"),
    [insertAtCursor],
  );
  const insertStrikethrough = useCallback(
    () => insertAtCursor("~~", "~~", "strikethrough"),
    [insertAtCursor],
  );
  const insertInlineCode = useCallback(
    () => insertAtCursor("`", "`", "code"),
    [insertAtCursor],
  );
  const insertLink = useCallback(
    () => insertAtCursor("[", "](url)", "link text"),
    [insertAtCursor],
  );
  const insertImage = useCallback(
    () => insertAtCursor("![", "](url)", "alt text"),
    [insertAtCursor],
  );

  const insertCodeBlock = useCallback(
    (lang = "javascript") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = contentRef.current;
      const selectedText = currentContent.substring(start, end);

      const before = "```" + lang + "\n";
      const after = "\n```";
      const text = selectedText || "// code here";

      const newText =
        currentContent.substring(0, start) +
        before +
        text +
        after +
        currentContent.substring(end);
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        if (!selectedText) {
          textarea.setSelectionRange(
            start + before.length,
            start + before.length + text.length,
          );
        }
      }, 0);
    },
    [onChange],
  );

  const insertList = useCallback(
    (ordered = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const currentContent = contentRef.current;
      const prefix = ordered ? "1. " : "- ";
      const newText =
        currentContent.substring(0, start) +
        "\n" +
        prefix +
        currentContent.substring(start);
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const pos = start + 1 + prefix.length;
        textarea.setSelectionRange(pos, pos);
      }, 0);
    },
    [onChange],
  );

  const insertBlockquote = useCallback(
    () => insertAtCursor("\n> ", "", "quote"),
    [insertAtCursor],
  );

  const insertHr = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const currentContent = contentRef.current;
    const newText =
      currentContent.substring(0, start) +
      "\n\n---\n\n" +
      currentContent.substring(start);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const pos = start + 6;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }, [onChange]);

  const insertTable = useCallback(() => {
    const table =
      "\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n";
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const currentContent = contentRef.current;
    const newText =
      currentContent.substring(0, start) +
      table +
      currentContent.substring(start);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + table.length, start + table.length);
    }, 0);
  }, [onChange]);

  const insertTaskList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const currentContent = contentRef.current;
    const taskList =
      "\n- [ ] Task item\n- [ ] Another task\n- [x] Completed task\n";
    const newText =
      currentContent.substring(0, start) +
      taskList +
      currentContent.substring(start);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const pos = start + taskList.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }, [onChange]);

  // Keyboard shortcuts — uses refs to avoid stale closures
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault();
            insertBold();
            break;
          case "i":
            e.preventDefault();
            insertItalic();
            break;
          case "k":
            e.preventDefault();
            insertLink();
            break;
          case "`":
            e.preventDefault();
            insertInlineCode();
            break;
          default:
            break;
        }
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentContent = contentRef.current;

        // Find the start of the current line
        const lineStart = currentContent.lastIndexOf("\n", start - 1) + 1;
        const lineText = currentContent.substring(lineStart, end);

        if (e.shiftKey) {
          // Shift+Tab: remove up to 2 spaces from line start
          const match = lineText.match(/^( {1,2})/);
          if (match) {
            const removed = match[1].length;
            const newText =
              currentContent.substring(0, lineStart) +
              lineText.substring(removed) +
              currentContent.substring(end);
            onChangeRef.current(newText);
            setTimeout(() => {
              const newPos = Math.max(lineStart, start - removed);
              textarea.setSelectionRange(newPos, newPos);
            }, 0);
          }
        } else {
          // Tab: insert 2 spaces at the beginning of the line
          const newText =
            currentContent.substring(0, lineStart) +
            "  " +
            currentContent.substring(lineStart);
          onChangeRef.current(newText);
          setTimeout(() => {
            textarea.setSelectionRange(start + 2, start + 2);
          }, 0);
        }
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    return () => textarea.removeEventListener("keydown", handleKeyDown);
  }, [insertBold, insertItalic, insertLink, insertInlineCode]);

  const compressAndInsertImage = useCallback(
    (file) => {
      const placeholderId = Date.now();
      const placeholderText = `![Uploading image ${placeholderId}...]()`;
      insertAtCursor(placeholderText, "", "");

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

          try {
            // Store the data URI in a separate localStorage object
            const storedImages = JSON.parse(
              localStorage.getItem("codestudynotes-images") || "{}"
            );
            storedImages[placeholderId] = dataUrl;
            localStorage.setItem(
              "codestudynotes-images",
              JSON.stringify(storedImages)
            );

            // Replace placeholder with just the ID reference
            const currentContent = contentRef.current;
            const newText = currentContent.replace(
              placeholderText,
              `![Pasted image](id:${placeholderId})`
            );
            onChangeRef.current(newText);
          } catch (e) {
            // If storage is full (5MB limit hit), alert and remove placeholder
            alert("Storage full! Cannot paste any more images.");
            const newText = contentRef.current.replace(placeholderText, "");
            onChangeRef.current(newText);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    },
    [insertAtCursor],
  );

  const handlePaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") === 0) {
          e.preventDefault();
          const file = items[i].getAsFile();
          compressAndInsertImage(file);
          break; // Only handle the first pasted image
        }
      }
    },
    [compressAndInsertImage],
  );

  const stats = useMemo(() => {
    if (!content) return { words: 0, chars: 0 };
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return { words, chars: content.length };
  }, [content]);

  return (
    <div
      className={`editor ${expanded ? "editor-expanded" : ""}`}
      style={style}
    >
      <div className="editor-header">
        <div className="editor-header-left">
          <div className="editor-title-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <span className="editor-title">Editor</span>
        </div>
        <div className="editor-header-right">
          <span className="editor-stats">
            {stats.words} words · {stats.chars} chars
          </span>
          <button
            className="header-icon-btn theme-toggle-btn"
            onClick={onToggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? icons.sun : icons.moon}
          </button>
          <button
            className="header-icon-btn expand-btn"
            onClick={onToggleExpand}
            title={expanded ? "Exit fullscreen" : "Fullscreen editor"}
          >
            {expanded ? icons.collapse : icons.expand}
          </button>
        </div>
      </div>
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => insertHeading(1)}
            title="Heading 1"
          >
            H1
          </button>
          <button
            className="toolbar-btn"
            onClick={() => insertHeading(2)}
            title="Heading 2"
          >
            H2
          </button>
          <button
            className="toolbar-btn"
            onClick={() => insertHeading(3)}
            title="Heading 3"
          >
            H3
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={insertBold}
            title="Bold (Ctrl+B)"
          >
            {icons.bold}
          </button>
          <button
            className="toolbar-btn"
            onClick={insertItalic}
            title="Italic (Ctrl+I)"
          >
            {icons.italic}
          </button>
          <button
            className="toolbar-btn"
            onClick={insertStrikethrough}
            title="Strikethrough"
          >
            {icons.strikethrough}
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={insertInlineCode}
            title="Inline Code (Ctrl+`)"
          >
            {icons.code}
          </button>
          <CodeBlockDropdown onInsert={insertCodeBlock} />
          <button
            className="toolbar-btn"
            onClick={insertLink}
            title="Link (Ctrl+K)"
          >
            {icons.link}
          </button>
          <button className="toolbar-btn" onClick={insertImage} title="Image">
            {icons.image}
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => insertList(false)}
            title="Bullet List"
          >
            {icons.list}
          </button>
          <button
            className="toolbar-btn"
            onClick={() => insertList(true)}
            title="Numbered List"
          >
            {icons.orderedList}
          </button>
          <button
            className="toolbar-btn"
            onClick={insertTaskList}
            title="Task List (checkboxes)"
          >
            {icons.task}
          </button>
          <button
            className="toolbar-btn"
            onClick={insertBlockquote}
            title="Blockquote"
          >
            {icons.quote}
          </button>
          <button className="toolbar-btn" onClick={insertTable} title="Table">
            {icons.table}
          </button>
          <button
            className="toolbar-btn"
            onClick={insertHr}
            title="Horizontal Rule"
          >
            {icons.hr}
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        placeholder={`Start typing your notes here...

Use Markdown to format:
  # Heading 1    ## Heading 2    ### Heading 3
  **bold**  *italic*  \`inline code\`
  - bullet list    1. numbered list
  - [ ] task list  - [x] done task

Code blocks with syntax highlighting:
  \`\`\`python
  def binary_search(arr, target):
      lo, hi = 0, len(arr) - 1
      while lo <= hi:
          mid = (lo + hi) // 2
          if arr[mid] == target: return mid
          elif arr[mid] < target: lo = mid + 1
          else: hi = mid - 1
      return -1
  \`\`\`

Math with LaTeX:  $O(n \\log n)$  or block:
  $$\\sum_{i=0}^{n} i = \\frac{n(n+1)}{2}$$

Tables, blockquotes, links, and more!`}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
      />
    </div>
  );
}

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "yaml",
  "markdown",
];

function CodeBlockDropdown({ onInsert }) {
  const detailsRef = useRef(null);

  const handleSelect = (lang) => {
    onInsert(lang);
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <details className="code-dropdown" ref={detailsRef}>
      <summary className="toolbar-btn" title="Code Block (choose language)">
        {icons.codeBlock}
      </summary>
      <div className="code-dropdown-menu">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            className="code-dropdown-item"
            onClick={() => handleSelect(lang)}
          >
            {lang}
          </button>
        ))}
      </div>
    </details>
  );
}

export default Editor;
