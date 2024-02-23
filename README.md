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

## FAQ

### Q: Why Use Blend Instead of Git Submodules?
Git submodules can be complex and difficult to manage. Blend provides a simpler, more intuitive way to manage dependencies without the overhead of Git submodules.

### Q: What programming languages can I use with Blend?
Blend is language-agnostic and can be used with any programming language.

### Q: Can Blend handle dependencies from private repositories?
Sure! Blend uses your local git configuration to authenticate with the remote repository. If you have access to the private repository, Blend will be able to fetch the dependencies from it.

### Q: What happens if a dependency's remote version is updated after it's been added with Blend?
You can run `blend update` to update the dependencies to their latest versions. Blend will fetch the latest versions of the dependencies from their remote repositories and update the local copies in your project.

### Q: Is Blend suitable for managing large-scale projects with numerous dependencies?
Yes, Blend is designed to handle projects of all sizes, including those with numerous dependencies.

### Q: Can Blend be integrated into continuous integration (CI) workflows?
You don't have to. Blend stores copies of the dependencies in your project repository, so they are available to your CI system without any additional setup.

### Q: Does Blend support version locking or pinning for dependencies?
Blend is designed to always use the latest version of a dependency. But you can add a dependency from a specific branch or tag to ensure that you always use a specific version. You can do this by adding a hash to the dependency's git URL.

### Q: How does Blend manage conflicts when updating dependencies?
Blend does not manage conflicts when updating dependencies. It's up to you to resolve any conflicts that may arise when updating dependencies.

### Q: Can Blend be used in conjunction with package managers like npm or yarn?
Absolutely! Blend is designed to work alongside package managers like npm or yarn. You can use Blend to manage your git dependencies while using npm or yarn to manage your package dependencies.

### Q: What happens if a dependency is removed or renamed in the remote repository?
If a dependency is removed or renamed in the remote repository, you will need to manually remove or update the dependency in your project. Blend does not automatically handle these changes.

### Q: Does Blend support recursive dependencies or nested dependency structures?
Not yet. Blend does not currently support recursive dependencies or nested dependency structures. However, this is a feature that we are considering for future releases.

## Why Blend is a Better Alternative to [Bit](https://bit.dev/)

Bit overcomplicates the simple task of managing dependencies at the file level. For instance, it introduces its own version manager for handling different versions of Bit itself. Additionally, Bit necessitates an external server to store components, whereas Blend utilizes existing repository infrastructure, minimizing setup requirements.

While Bit is open source, the company behind it seeks profit, leading to potential attempts to create additional revenue streams and lock users into their ecosystem.

In contrast, Blend simplifies dependency management by eliminating unnecessary overhead. It operates directly on top of Git and doesn't require any additional infrastructure.

## Why Blend is a Better Alternative to [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)

Git submodules have been a traditional method for managing dependencies within Git repositories. However, they come with various complexities and limitations that can hinder project maintenance and collaboration. There are numerous articles and discussions about the challenges of using Git submodules, such as [this one](https://codingkilledthecat.wordpress.com/2012/04/28/why-your-company-shouldnt-use-git-submodules/). There is also a discussion on Hacker News [why Git submodules are so bad](https://news.ycombinator.com/item?id=31792303).

Here's why Blend offers a superior alternative:

### Simplified Dependency Management

Git submodules introduce additional complexities to the workflow, such as submodule initialization, updates, and synchronizations. Blend simplifies dependency management with straightforward commands for adding, updating, committing, and removing dependencies, while keeping copies of the dependencies within the project repository.

#### Enhanced Flexibility

Git submodules often require users to navigate between multiple repositories, making it cumbersome to work with dependencies. Blend allows for easier integration and management of dependencies directly within the project repository, enhancing flexibility and ease of use.

#### Reduced Overhead

Managing Git submodules involves maintaining separate repository configurations and tracking changes across multiple repositories. Blend reduces this overhead by consolidating dependency management within a single tool, streamlining the development process.

#### Improved Collaboration

Git submodules can lead to complexities and conflicts, especially in collaborative environments with multiple contributors. Blend facilitates smoother collaboration by providing a unified approach to dependency management, reducing the likelihood of conflicts and enhancing productivity.

#### Seamless Integration

Blend seamlessly integrates with existing Git workflows, allowing users to leverage familiar version control practices while benefiting from simplified dependency management. Whether you're working on a small project or a large-scale application, Blend offers a seamless and efficient solution for managing dependencies.

#### Conclusion

While Git submodules have served as a traditional method for managing dependencies, their complexities and limitations often outweigh their benefits. Blend provides a modern and efficient alternative, offering simplified dependency management, enhanced flexibility, reduced overhead, improved collaboration, and seamless integration with existing workflows. Make the switch to Blend for a smoother and more efficient dependency management experience.


## License
Licensed under MIT license. Copyright (c) 2024 Max Nowack

## Contributions
Contributions are welcome. Please open issues and/or file Pull Requests.

## Maintainers
- Max Nowack ([maxnowack](https://github.com/maxnowack))
