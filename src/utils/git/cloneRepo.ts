import executeCommand from '../executeCommand.js'

export default async function cloneRepo(repo: string, path: string) {
  return executeCommand('git', ['clone', repo, path])
    .catch((error) => {
      if (error.message.includes('does not exist')) {
        throw new Error(`Unable to access repository ${repo}`)
      }
      /* istanbul ignore next -- @preserve */
      throw error
    })
}
