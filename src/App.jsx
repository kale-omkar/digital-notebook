import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import Editor from "./components/Editor";
import Preview from "./components/Preview";
import ErrorBoundary from "./components/ErrorBoundary";

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage full or unavailable
    }
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const [content, setContent] = useLocalStorage("codestudynotes-content", "");
  const [darkMode, setDarkMode] = useLocalStorage(
    "codestudynotes-darkmode",
    false,
  );
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light",
    );
  }, [darkMode]);

  const toggleDarkMode = useCallback(
    () => setDarkMode((d) => !d),
    [setDarkMode],
  );

  const toggleExpand = useCallback((panel) => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  }, []);

  const handleDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(80, Math.max(20, percent)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  const showBothPanels = expandedPanel === null;

  return (
    <div className="app">
      <main className="main-content">
        <div className="editor-preview-container" ref={containerRef}>
          {expandedPanel !== "preview" && (
            <Editor
              content={content}
              onChange={setContent}
              expanded={expandedPanel === "editor"}
              onToggleExpand={() => toggleExpand("editor")}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              style={
                showBothPanels ? { flex: `0 0 ${splitPercent}%` } : undefined
              }
            />
          )}
          {showBothPanels && (
            <div
              className="resize-divider"
              onMouseDown={handleDividerMouseDown}
              title="Drag to resize"
            />
          )}
          {expandedPanel !== "editor" && (
            <ErrorBoundary>
              <Preview
                content={content}
                expanded={expandedPanel === "preview"}
                onToggleExpand={() => toggleExpand("preview")}
                darkMode={darkMode}
                style={
                  showBothPanels
                    ? { flex: `0 0 ${100 - splitPercent}%` }
                    : undefined
                }
              />
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
