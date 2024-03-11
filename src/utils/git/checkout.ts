import executeCommand from '../executeCommand.js'

export default async function checkout(repo: string, branch: string) {
  return executeCommand('git', ['checkout', branch], {
    cwd: repo,
  }).catch((error) => {
    if (error.message.includes('did not match any file(s) known to git')) {
      throw new Error(`'${branch}' does not exist in the repository`)
    }
    /* istanbul ignore next -- @preserve */
    throw error
  })
}
