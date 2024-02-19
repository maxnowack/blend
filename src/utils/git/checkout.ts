import executeCommand from '../executeCommand'

export default async function checkout(repo: string, branch: string) {
  return executeCommand(`git checkout ${branch}`, {
    cwd: repo,
  })
}
