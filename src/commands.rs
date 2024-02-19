use std::env::current_dir;
use std::fs;
use std::path::{Path, PathBuf};
use tempfile::tempdir;
use fs_extra;
use crate::config;
use crate::git;


// Generic function to copy either a file or directory
fn copy_file_or_directory(source: &Path, destination: &Path) {
  if let Ok(metadata) = fs::metadata(source.clone()) {
    if metadata.is_dir() {
      for entry in fs::read_dir(&source).expect("Failed to read temp dir") {
        let entry = entry.expect("Failed to read entry");
        println!("{:?}", entry.path());
      }
      println!("Copying directory: {:?} to {:?}", source.clone(), destination.clone());
      fs_extra::dir::copy(source, destination, &fs_extra::dir::CopyOptions {
        overwrite: true,
        copy_inside: false,
        content_only: false,
        skip_exist: false,
        buffer_size: 64000,
        depth: 0,
      }).expect("Failed to copy directory");
    } else {
      println!("Copying file: {:?} to {:?}", source.clone(), destination.clone());
      fs::copy(source, destination).expect("Failed to copy file");
    }
  } else {
    eprintln!("Failed to read metadata for path {}", source.to_str().unwrap());
  }
}

fn clone_repo(repo: String, path: String) {
  let mut repo_parts = repo.split("#");
  let repo_url = repo_parts.next().unwrap();
  let branch = repo_parts.next().unwrap_or("");
  git::clone_repo(repo_url.to_string(), path.clone());
  if branch != "" {
    git::checkout(path.clone(), branch.to_string());
  }
}

pub fn add_repo(repo: String, remote_path: String, local_path: Option<String>) {
  let temp_dir = tempdir().expect("Failed to create temp dir");
  let repo_path = temp_dir.path().to_str().unwrap().to_string();
  clone_repo(repo.clone(), repo_path.clone());
  let mut path = PathBuf::from(&repo_path);
  path.push(remote_path.clone());
  let commit_hash = git::latest_hash(repo_path.clone());

  let packageConfig = config::get_config(path.to_str().unwrap().to_string());
  let mut configPath = PathBuf::from(current_dir().unwrap());
  configPath.push("blend.yml");
  let mut localConfig = config::get_config(configPath.to_str().unwrap().to_string()).unwrap_or(config::Config{
    name: None,
    description: None,
    hooks: None,
    dependencies: Some(vec![]),
  });
  localConfig.add_dependency_if_not_exists(config::Dependency {
    repo: repo,
    hash: commit_hash,
    local_path: local_path.clone(),
    remote_path: remote_path.clone(),
  });
  // write the new config to the local blend.yaml
  fs::write(configPath, config::create_config(localConfig)).expect("Failed to write new config");
  // print files in temp dir
  for entry in fs::read_dir(&repo_path).expect("Failed to read temp dir") {
    let entry = entry.expect("Failed to read entry");
    println!("{:?}", entry.path());
  }
  let mut local_dir = PathBuf::from(current_dir().unwrap());
  if Some(local_path) {
    local_dir.push(local_path);
  }
  copy_file_or_directory(&path, &local_dir);
  temp_dir.close().expect("Failed to remove temp dir");
}

pub fn update() {
  println!("Updating...");
}

pub fn remove(path: String) {
  println!("Removing: {:?}", path);
}
