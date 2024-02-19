use serde::{Deserialize, Serialize};
use serde_with;
use std::path::Path;
use std::fs::{self, File};
use std::io::{self, BufReader, BufRead};

#[derive(Debug, Deserialize, Serialize)]
pub struct Dependency {
  pub repo: String,
  pub hash: String,
  pub remote_path: String,
  pub local_path: String,
}

#[serde_with::skip_serializing_none]
#[derive(Debug, Deserialize, Serialize)]
pub struct Hooks {
  pub preinstall: Option<String>,
  pub postinstall: Option<String>,
  pub preuninstall: Option<String>,
  pub postuninstall: Option<String>,
}

#[serde_with::skip_serializing_none]
#[derive(Debug, Deserialize, Serialize)]
pub struct Config {
  pub name: Option<String>,
  pub description: Option<String>,
  pub hooks: Option<Hooks>,
  pub dependencies: Option<Vec<Dependency>>,
}

impl Config {
  // Add a new dependency only if its local path doesn't exist
  pub fn add_dependency_if_not_exists(&mut self, dependency: Dependency) {
    if let Some(ref mut dependencies) = self.dependencies {
      if !dependencies.iter().any(|dep| dep.local_path == dependency.local_path) {
        dependencies.push(dependency);
      } else {
        println!("Dependency with local path {} already exists. Dependency not added.", dependency.local_path);
      }
    } else {
      self.dependencies = Some(vec![dependency]);
    }
  }
}


pub fn parse_config(yaml: String) -> Config {
  return serde_yaml::from_str(&yaml).expect("Failed to parse config");
}

pub fn create_config(config: Config) -> String {
  return serde_yaml::to_string(&config).expect("Failed to serialize config");
}

fn extract_first_block_comment(file_path: String) -> io::Result<Option<String>> {
  let file = File::open(file_path)?;
  let reader = io::BufReader::new(file);

  let mut in_block_comment = false;
  let mut block_comment_content = String::new();

  for line in reader.lines() {
    let line = line?;
    if in_block_comment {
      if let Some(end_index) = line.find("*/") {
        block_comment_content.push_str(&line[..end_index]);
        return Ok(Some(block_comment_content.trim().to_string()));
      } else {
        block_comment_content.push_str(&line);
        block_comment_content.push('\n');
      }
    } else if let Some(start_index) = line.find("/*") {
      in_block_comment = true;
      block_comment_content.push_str(&line[start_index + 2..]);
      if let Some(end_index) = block_comment_content.find("*/") {
        block_comment_content = block_comment_content[..end_index].to_string();
        return Ok(Some(block_comment_content.trim().to_string()));
      }
    }
  }

  Ok(None)
}

pub fn get_config(path: String) -> Option<Config> {
  // Check if path is a directory, look for blend.yaml
  if let Ok(metadata) = fs::metadata(path.clone()) {
    if metadata.is_dir() {
      let file_path = Path::new(&path).join("blend.yml");
      if let Ok(file) = fs::File::open(file_path.clone()) {
        let reader = BufReader::new(file);
        if let Ok(config) = serde_yaml::from_reader(reader) {
          return Some(config);
        } else {
          eprintln!("Failed to parse config from {:?}", file_path.clone());
        }
      } else {
        eprintln!("Failed to open file {:?}", file_path.clone());
      }
    } else {
      // If path is a file, open it and look for yaml content in the block comment on top
      if let Ok(Some(comment)) = extract_first_block_comment(path.clone()) {
        return Some(parse_config(comment));
      } else {
        eprintln!("No yaml found in file at {}", path.clone());
      }
    }
  } else {
    eprintln!("Failed to read metadata for path {}", path.clone());
  }
  None
}
