import executeCommand from '../executeCommand'

export default async function cloneRepo(repo: string, path: string) {
  return executeCommand(`git clone ${repo} ${path}`)
}
