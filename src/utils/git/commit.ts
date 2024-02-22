import executeCommand from '../executeCommand.js'

export default async function commit(repoPath: string, message?: string) {
  await executeCommand('git add .', { cwd: repoPath })
  if (message != null) {
    await executeCommand(`git commit -m "${message}"`, { cwd: repoPath })
  } else {
    await executeCommand('git commit', {
      cwd: repoPath,
      stdoutPipe: process.stdout,
      stderrPipe: process.stderr,
    })
  }
  await executeCommand('git push', { cwd: repoPath })
}
