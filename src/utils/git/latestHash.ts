import executeCommand from '../executeCommand.js'

export default async function latestHash(repo: string) {
  const output = await executeCommand('git rev-parse HEAD', {
    cwd: repo,
  })
  return output.trim()
}
