# Blend

Blend is a lightweight Node.js tool designed to simplify managing dependencies within a project without using Git submodules. It provides an alternative approach for handling external code or resources that are necessary for your project's functionality.

## Features

* **Dependency Management:** Easily add, update, commit, and remove dependencies.
* **Simplified Workflow:** Streamlined commands for managing dependencies without the complexities of Git submodules.
* **Automatic Dependency Tracking:** Keeps track of dependencies and their versions locally.

## Installation

Blend can be installed via npm (note the missing 'e'):

```bash
npm install -g blnd
```

## Usage

### Adding a Dependency

To add a dependency to your project, use the `add` command:

```bash
blend add <repository> <remote-path> [<local-path>]
```

* `<repository>`: The URL of the repository containing the dependency.
* `<remote-path>`: The path to the directory or file within the repository.
* `[<local-path>]` (optional): The local directory where the dependency will be copied. If not provided, it defaults to the remote path.

### Updating Dependencies

To update dependencies to their latest versions, use the `update` command:

```bash
blend update
```

### Committing Changes

After making changes to a dependency, commit the changes using the commit command:

```bash
blend commit <local-path> "<commit-message>"
```

* `<local-path>`: The local path of the dependency.
* `"<commit-message>"`: The commit message describing the changes made.

### Removing a Dependency

To remove a dependency from your project, use the `remove` command:

```bash
blend remove <local-path>
```

* `<local-path>`: The local path of the dependency.



## License
Licensed under MIT license. Copyright (c) 2024 Max Nowack

## Contributions
Contributions are welcome. Please open issues and/or file Pull Requests.

## Maintainers
- Max Nowack ([maxnowack](https://github.com/maxnowack))
