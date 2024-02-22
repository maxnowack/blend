import executeCommand from '../executeCommand.js'
import checkout from './checkout.js'

export default async function reset(repoPath: string, branch?: string) {
  await executeCommand(`git reset --hard${branch != null ? ` ${branch}` : ''}`, {
    cwd: repoPath,
  })
  if (branch) await checkout(repoPath, branch)
}
