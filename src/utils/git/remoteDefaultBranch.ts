import executeCommand from '../executeCommand.js'

export default async function remoteDefaultBranch(repoPath: string) {
  return executeCommand("git remote show origin | grep 'HEAD branch' | cut -d' ' -f5", {
    cwd: repoPath,
  })
}
