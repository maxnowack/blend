use clap::{Parser, Subcommand};
mod commands;
mod config;
mod git;

#[derive(Parser)]
#[command(name = "blend")]
#[command(author = "Max Nowack <max.nowack@gmail.com>")]
#[command(version = "0.1")]
#[command(about = None, long_about = None)]
struct Cli {
  #[command(subcommand)]
  command: Option<Commands>,
}


#[derive(Subcommand)]
enum Commands {
  Add {
    repo: String,
    remote_path: String,
    local_path: Option<String>,
  },
  Update {},
  Remove {
    path: String,
  },
}

fn main() {
  let cli = Cli::parse();

  match &cli.command {
    Some(Commands::Add { repo, remote_path, local_path }) => {
      commands::add_repo(repo.clone(), remote_path.clone(), local_path.clone());
    }
    Some(Commands::Update {}) => {
      commands::update()
    }
    Some(Commands::Remove { path }) => {
      commands::remove(path.clone());
    }
    None => {}
  }

}
