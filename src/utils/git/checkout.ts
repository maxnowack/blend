import executeCommand from '../executeCommand.js'

export default async function checkout(repo: string, branch: string) {
  return executeCommand(`git checkout ${branch}`, {
    cwd: repo,
  })
}
