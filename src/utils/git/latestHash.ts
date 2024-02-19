import executeCommand from '../executeCommand'

export default async function latestHash(repo: string) {
  const output = await executeCommand('git rev-parse HEAD', {
    cwd: repo,
  })
  return output.trim()
}
