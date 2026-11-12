export type FileNode =
  | { kind: "file"; name: string; path: string }
  | { kind: "dir"; name: string; path: string; children: FileNode[] };

export type Project = { 
    name: string; 
    root: string; 
    version: string; 
    tree: FileNode 
};

export type RecentProject = {
  name: string;
  path: string;
  last_opened: number;   // seconds since 1970 (Unix time)
};
