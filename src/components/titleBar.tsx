import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();
const isMac = navigator.userAgent.includes("Mac");

type Item =
  | "separator"
  | { label: string; shortcut?: string; action?: () => void };
type Menu = { label: string; items: Item[] };

// "Mod" means Ctrl on Windows/Linux and Cmd on macOS
const menus: Menu[] = [
  {
    label: "File",
    items: [
      { label: "New Project", shortcut: "Mod+N", action: () => console.log("new") },
      { label: "Open Project...", shortcut: "Mod+O", action: () => console.log("open") },
      "separator",
      { label: "Save", shortcut: "Mod+S", action: () => console.log("save") },
      { label: "Save All", shortcut: "Mod+Shift+S", action: () => console.log("save all") },
      "separator",
      { label: "Exit", shortcut: "Alt+F4", action: () => appWindow.close() },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", shortcut: "Mod+Z" },
      { label: "Redo", shortcut: "Mod+Shift+Z" },
      "separator",
      { label: "Cut", shortcut: "Mod+X" },
      { label: "Copy", shortcut: "Mod+C" },
      { label: "Paste", shortcut: "Mod+V" },
    ],
  },
];

// "Mod+Shift+S" -> "Ctrl+Shift+S" (or "⌘⇧S" on macOS)
function display(shortcut: string) {
  const parts = shortcut.split("+").map((k) =>
    k === "Mod" ? (isMac ? "⌘" : "Ctrl") : k === "Shift" && isMac ? "⇧" : k
  );
  return parts.join(isMac ? "" : "+");
}

function matches(e: KeyboardEvent, shortcut: string) {
  const parts = shortcut.split("+");
  const key = parts[parts.length - 1].toLowerCase();
  const mod = isMac ? e.metaKey : e.ctrlKey;
  return (
    mod === parts.includes("Mod") &&
    e.shiftKey === parts.includes("Shift") &&
    e.altKey === parts.includes("Alt") &&
    e.key.toLowerCase() === key
  );
}

export default function TitleBar() {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // close the dropdown on outside click, Escape, or when the window loses focus
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onBlur = () => setOpen(null);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // make the keyboard shortcuts actually run the menu actions
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      for (const menu of menus) {
        for (const item of menu.items) {
          if (item !== "separator" && item.shortcut && item.action && matches(e, item.shortcut)) {
            e.preventDefault();
            item.action();
            setOpen(null);
            return;
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="title-bar" ref={barRef} data-tauri-drag-region>
      <div className="title-bar-title" data-tauri-drag-region>EUCLID</div>

      <nav className="title-bar-menus" role="menubar">
        {menus.map((menu) => (
          <div className="menu" key={menu.label}>
            <button
              className={"menu-button" + (open === menu.label ? " open" : "")}
              role="menuitem"
              aria-haspopup="true"
              aria-expanded={open === menu.label}
              onClick={() => setOpen(open === menu.label ? null : menu.label)}
              onMouseEnter={() => open && setOpen(menu.label)}  // switch menus by hovering
            >
              {menu.label}
            </button>

            {open === menu.label && (
              <div className="menu-dropdown" role="menu">
                {menu.items.map((item, i) =>
                  item === "separator" ? (
                    <div key={i} className="menu-separator" role="separator" />
                  ) : (
                    <button
                      key={item.label}
                      className="menu-item"
                      role="menuitem"
                      onClick={() => { item.action?.(); setOpen(null); }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className="menu-shortcut">{display(item.shortcut)}</span>}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="title-bar-drag-region" data-tauri-drag-region />

      <div className="title-bar-controls">
        <button className="title-bar-btn" aria-label="Minimize" onClick={() => appWindow.minimize()}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" /></svg>
        </button>
        <button className="title-bar-btn" aria-label="Maximize" onClick={() => appWindow.toggleMaximize()}>
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" /></svg>
        </button>
        <button className="title-bar-btn close" aria-label="Close" onClick={() => appWindow.close()}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" /></svg>
        </button>
      </div>
    </div>
  );
}