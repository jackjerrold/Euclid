import { useEffect, useState } from "react";
import { documentDir } from "@tauri-apps/api/path";
import Logo from "./Logo";
import TitleBar from "./titleBar";
import { useFiles } from "../hooks/useFiles";
import { Project, RecentProject } from "../types";

const recent = [
  { name: "bracket", path: "~/models/bracket", when: "Today" },
  { name: "gearbox-housing", path: "~/models/gearbox-housing", when: "3 days ago" },
  { name: "phone-stand", path: "~/models/phone-stand", when: "Last week" },
  { name: "hinge-test", path: "~/Documents/hinge-test", when: "2 weeks ago" },
];

export default function StartScreen({ onOpen }: { onOpen: (p: Project) => void }) {
  const { createProject, loadProject, pickFolder, getRecent } = useFiles();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<RecentProject[]>([]);

  useEffect(() => {
    getRecent().then(setRecent).catch(() => setRecent([]));
  }, []);

  async function handleOpen() {
    setError("");
    try {
      const folder = await pickFolder();
      if (folder === null) return;
      const project = await loadProject(folder);
      onOpen(project);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleCreate() {
    setError("");
    try {
      const parent = await documentDir();
      const project = await createProject(name.trim(), parent);
      onOpen(project);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleOpenRecent(path: string) {
    setError("");
    try {
      const project = await loadProject(path);   // Rust checks it still exists and moves it to the top
      onOpen(project);
    } catch (e) {
      setError(String(e));
    }
  }

  function timeAgo(seconds: number): string {
    const days = Math.floor((Date.now() - seconds * 1000) / 86_400_000);   // ms in a day
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 14) return "Last week";
    return `${Math.floor(days / 7)} weeks ago`;
  }

  return(
    <main>
      <TitleBar />
    <div className="start">
        <section className="start-left">  
          <div className="start-brand">
            <Logo />
            <div className="brand-text">
              <div className="brand-name">
                EUCLID
              </div>
              <div className="brand-tagline">
                A Programming Language for CAD
              </div>
              <div className="version">v0.0.1</div>
            </div>
          </div>
          <section className="start-btns">
            <button className="start-btn" onClick={() => setNaming(true)}>New Project</button>            
            <button className="start-btn" onClick={() => {handleOpen()}}>Open Project</button>          
          </section>

          {naming && (
              <div className="new-project">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Project name"
                  autoFocus
                />
                <button onClick={handleCreate}>Create</button>
                <button onClick={() => { setNaming(false); setError(""); }}>Cancel</button>
                {error && <div className="error">{error}</div>}
              </div>
            )}

        </section>

        <section className="start-right">
          <h2>Recent</h2>
          <ul className="recent">
            {recent.map((r) => (
              <li key={r.name}>
                <button className="recent-row" onClick={() => handleOpenRecent(r.path)}>
                  <span className="recent-name">{r.name}</span>
                  <span className="recent-path">{r.path}</span>
                  <span className="recent-when">{timeAgo(r.last_opened)}</span>
                </button>
              </li>
            ))}
          </ul> 
        </section>
    </div>
    </main>
  )
}