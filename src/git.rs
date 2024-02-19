use std::process::Command;

pub fn clone_repo(repo: String, local_path: String) {
  Command::new("git")
    .arg("clone")
    .arg(repo)
    .arg(local_path)
    .output()
    .expect("Failed to clone repo");
}

pub fn checkout(repo: String, branch: String) {
  Command::new("git")
    .arg("checkout")
    .arg(branch)
    .output()
    .expect("Failed to checkout branch");
}

pub fn latest_hash(repo: String) -> String {
  let output = Command::new("git")
    .current_dir(repo)
    .arg("rev-parse")
    .arg("HEAD")
    .output()
    .expect("Failed to get latest hash");

  let output_str = String::from_utf8_lossy(&output.stdout);
  let hash = output_str.split_whitespace().next().unwrap();
  return hash.to_string();
}
