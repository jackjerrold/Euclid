use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize,Serialize};
use tauri::Manager;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Clone, Deserialize)]
pub struct RecentProject {
    pub name: String,
    pub path: String,
    pub last_opened: u64,
}

const MAX_RECENT: usize = 10;

#[derive(Serialize, Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum FileNode {
    File { name: String, path: String },
    Dir  { name: String, path: String, children: Vec<FileNode> },
}

#[derive(Serialize, Clone, Deserialize)]
pub struct Project {
    pub name: String,
    pub root: PathBuf,
    pub version: String,
    pub tree: FileNode,
}

fn project_start_string() -> String {
    format!("//The start of something bigger!\n\nrender(cube(10));")
}

fn valid_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 64
        && !name.starts_with('.')
        && !name.contains(['/', '\\', ':', '*', '?', '"', '<', '>', '|'])
}

fn build_file_tree(path: &PathBuf) -> FileNode {
    let name = path.file_name().unwrap().to_string_lossy().into_owned();
    if path.is_dir() {
        let children = fs::read_dir(path)
            .unwrap()
            .filter_map(|entry| entry.ok())
            .map(|entry| build_file_tree(&entry.path()))
            .collect();
        FileNode::Dir { name, path: path.to_string_lossy().into_owned(), children }
    } else {
        FileNode::File { name, path: path.to_string_lossy().into_owned() }
    }
}

#[tauri::command]
fn load_project(app: tauri::AppHandle, path: String) -> Result<Project, String> {

    let root = PathBuf::from(&path);
    if !root.exists() || !root.is_dir() {
        return Err("Project directory does not exist.".to_string());
    }

    let project_file = root.join("euclid.json");
    if !project_file.exists() {
        return Err("Project file (euclid.json) does not exist.".to_string());
    }

    let project_data = fs::read_to_string(&project_file)
        .map_err(|e| format!("Could not read euclid.json: {e}"))?;
    let project_json: serde_json::Value = serde_json::from_str(&project_data)
        .map_err(|e| format!("euclid.json is not valid JSON: {e}"))?;

    let name = project_json["name"].as_str().unwrap_or("").to_string();
    let version = project_json["version"].as_str().unwrap_or("").to_string();

    // Build the file tree
    let tree = build_file_tree(&root);

    let _ = add_recent(&app, &name, &root.to_string_lossy());
    Ok(Project { name, root, version, tree })   
}

#[tauri::command]
fn create_project(app: tauri::AppHandle, parent: String, name: String) -> Result<Project, String> {
    if !valid_name(&name) {
        return Err("Invalid project name.".to_string());
    }
    let root = PathBuf::from(&parent).join(&name);
    if root.exists() {
        return Err("A folder with that name already exists.".to_string());
    }

    fs::create_dir_all(&root)
        .map_err(|e| format!("Could not create project folder: {e}"))?;
    fs::write(
        root.join("euclid.json"),
        format!(r#"{{"name":"{}","version":"0.1.0"}}"#, name),
    )
    .map_err(|e| format!("Could not write euclid.json: {e}"))?;
    fs::create_dir(root.join("src"))
        .map_err(|e| format!("Could not create src folder: {e}"))?;
    fs::write(root.join("src/main.mdl"), project_start_string())
        .map_err(|e| format!("Could not write main.mdl: {e}"))?;
    fs::create_dir(root.join("builds"))
        .map_err(|e| format!("Could not create builds folder: {e}"))?;

    let tree = build_file_tree(&root);

    let _ = add_recent(&app, &name, &root.to_string_lossy());
    Ok(Project { name, root, version: "0.1.0".into(), tree })
}

//-----------------RECENT STUF------------------------

fn recent_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("recent.json"))
}

fn read_recent(app: &tauri::AppHandle) -> Vec<RecentProject> {
    recent_file(app).ok()
        .and_then(|f| fs::read_to_string(f).ok())
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

fn add_recent(app: &tauri::AppHandle, name: &str, path: &str) -> Result<(), String> {
    let mut list = read_recent(app);
    list.retain(|r| r.path != path);
    list.insert(0, RecentProject {
        name: name.to_string(),
        path: path.to_string(),
        last_opened: SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0),
    });
    list.truncate(MAX_RECENT);                            // keep the newest 10
    let text = serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?;
    fs::write(recent_file(app)?, text).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_recent_projects(app: tauri::AppHandle) -> Vec<RecentProject> {
    let mut list = read_recent(&app);
    list.retain(|r| Path::new(&r.path).join("euclid.json").exists());   // hide deleted projects
    list
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_project, 
            get_recent_projects,
            load_project
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
