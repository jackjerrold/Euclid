import { invoke } from "@tauri-apps/api/core";
import { Project, RecentProject } from "../types";
import { open } from "@tauri-apps/plugin-dialog";  

export function useFiles() {

  const createProject = async (name: string, parentDir: string): Promise<Project> => {
    return await invoke<Project>("create_project", {
      name,
      parent: parentDir,
    });
  };

  const pickFolder = async (): Promise<string | null> => {
    return await open({
      directory: true,
      multiple: false,
      title: "Open EUCLID project",
    });
  };

  const loadProject = async (path: string): Promise<Project> => {
    return await invoke<Project>("load_project", { path });
  };
  
  const getRecent = async (): Promise<RecentProject[]> => {
    return await invoke<RecentProject[]>("get_recent_projects");
  };

  return { createProject, pickFolder, loadProject, getRecent};
}

