import TitleBar from "./titleBar";
import { Project } from "../types";

export default function WorkScreen({ project }: { project: Project }) {
  return (
    <main>
      <TitleBar />
    <body className="work-screen">
      <section className="project-hierarcy"></section>
      <section className="text-editor"></section>
      <section className="right-panel-group">
        <section className="veiwport"></section>
        <section className="console"></section>
      </section>
    </body>
    </main>
  );
}

