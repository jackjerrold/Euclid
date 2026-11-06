import Logo from "./Logo";
import TitleBar from "./titleBar";

const recent = [
  { name: "bracket", path: "~/models/bracket", when: "Today" },
  { name: "gearbox-housing", path: "~/models/gearbox-housing", when: "3 days ago" },
  { name: "phone-stand", path: "~/models/phone-stand", when: "Last week" },
  { name: "hinge-test", path: "~/Documents/hinge-test", when: "2 weeks ago" },
];

export default function StartScreen({ onOpen }: { onOpen: (p: string) => void }) {
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
            <button className="start-btn" onClick={() => onOpen("New Project")}>New Project</button>
            <button className="start-btn" onClick={() => onOpen("Open Project")}>Open Project</button>
          </section>
        </section>

        <section className="start-right">
          <h2>Recent</h2>
          <ul className="recent">
            {recent.map((r) => (
              <li key={r.name}>
                <button className="recent-row" onClick={() => onOpen(r.path)}>
                  <span className="recent-name">{r.name}</span>
                  <span className="recent-path">{r.path}</span>
                  <span className="recent-when">{r.when}</span>
                </button>
              </li>
            ))}
          </ul> 
        </section>
    </div>
    </main>
  )
}


