import executeCommand from '../executeCommand.js'

export default async function cloneRepo(repo: string, path: string) {
  return executeCommand(`git clone ${repo} ${path}`)
}
