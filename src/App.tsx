// App.tsx
import { useState } from "react";
import StartScreen from "./components/startScreen";
import WorkScreen from "./components/workScreen";
import { Project } from "./types";
import "./App.css";

export default function App() {
  const [project, setProject] = useState<Project | null>(null);

  return project === null ? (
    <StartScreen onOpen={setProject} />
  ) : (
    <WorkScreen project={project} />
  );
}

