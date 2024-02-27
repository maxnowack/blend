import executeCommand from '../executeCommand.js'

export default async function commit(repoPath: string, message: string) {
  await executeCommand('git add .', { cwd: repoPath })
  await executeCommand(`git commit -m "${message}"`, { cwd: repoPath })
  await executeCommand('git push', { cwd: repoPath })
}
