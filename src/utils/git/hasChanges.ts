import path from 'path'
import executeCommand from '../executeCommand.js'

export default async function hasChanges(filePath: string) {
  const untrackedFiles = (await executeCommand('git', [
    'ls-files',
    '--others',
    '--exclude-standard',
    path.basename(filePath),
  ], {
    cwd: path.dirname(filePath),
  })).trim().split('\n').filter(Boolean)
  if (untrackedFiles.length > 0) return true

  return executeCommand('git', [
    'diff',
    '-s',
    '--exit-code',
    filePath,
  ], {
    cwd: path.dirname(filePath),
  })
    .then(() => false)
    .catch(() => true)
}
