import executeCommand from '../executeCommand.js'

export default async function remoteDefaultBranch(repoPath: string) {
  const remoteInfo = await executeCommand('git', ['remote', 'show', 'origin'], {
    cwd: repoPath,
  })
  const match = remoteInfo.match(/HEAD branch: (.+)/)
  /* istanbul ignore if -- @preserve */
  if (!match) throw new Error('Unable to find default branch')
  return match[1]
}
