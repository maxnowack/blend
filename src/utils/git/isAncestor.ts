import executeCommand from '../executeCommand.js'

export default async function isAncestor(
  ancestor: string,
  descendant: string,
  repoPath: string,
) {
  return executeCommand('git', [
    'merge-base',
    '--is-ancestor',
    ancestor,
    descendant,
  ], {
    cwd: repoPath,
  })
    .then(() => true)
    .catch(() => false)
}
