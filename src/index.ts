#!/usr/bin/env node
import tmp from 'tmp'
import * as commands from './commands'

tmp.setGracefulCleanup()

interface AddParameters {
  type: 'add',
  repo: string,
  remotePath: string,
  localPath: string,
}
interface UpdateParameters {
  type: 'update',
}
interface RemoveParameters {
  type: 'remove',
  path: string,
}
type ScriptParameters = AddParameters | UpdateParameters | RemoveParameters
function getParameters(): ScriptParameters {
  const [type, ...args] = process.argv.slice(2)

  if (type === 'add') {
    if (args.length !== 3) throw new Error('add requires 3 arguments: repo, remotePath, localPath')
    const [repo, remotePath, localPath] = args
    return { type, repo, remotePath, localPath }
  }

  if (type === 'update') {
    if (args.length !== 0) throw new Error('update requires 0 arguments')
    return { type }
  }

  if (type === 'remove') {
    if (args.length !== 1) throw new Error('remove requires 1 argument: path')
    const [path] = args
    return { type, path }
  }

  throw new Error(`Invalid type: ${type}`)
}

const start = async () => {
  const parameters = getParameters()
  if (parameters.type === 'add') {
    commands.add(parameters.repo, parameters.remotePath, parameters.localPath)
  } else if (parameters.type === 'update') {
    commands.update()
  }
  else if (parameters.type === 'remove') {
    commands.remove(parameters.path)
  }
}

start()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
