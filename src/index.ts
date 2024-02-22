#!/usr/bin/env node
import temp from 'temp'
import * as commands from './commands.js'

temp.track()

interface AddParameters {
  type: 'add',
  repo: string,
  remotePath: string,
  localPath?: string,
}
interface UpdateParameters {
  type: 'update',
}
interface CommitParameters {
  type: 'commit',
  localPath: string,
  message: string,
}
interface RemoveParameters {
  type: 'remove',
  path: string,
}
type ScriptParameters = AddParameters | UpdateParameters | CommitParameters | RemoveParameters
function getParameters(): ScriptParameters {
  const [type, ...args] = process.argv.slice(2)

  if (type === 'add') {
    if (args.length < 2) {
      throw new Error('add requires at least 2 arguments: repo, path, (localPath)')
    }
    const [repo, remotePath, localPath] = args
    return { type, repo, remotePath, localPath }
  }

  if (type === 'update') {
    if (args.length !== 0) throw new Error('update requires 0 arguments')
    return { type }
  }

  if (type === 'commit') {
    if (args.length !== 2) throw new Error('commit requires 2 arguments: path, message')
    const [localPath, message] = args
    return { type, localPath, message }
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
    await commands.add(parameters.repo, parameters.remotePath, parameters.localPath)
  } else if (parameters.type === 'update') {
    await commands.update()
  } else if (parameters.type === 'commit') {
    await commands.commit(parameters.localPath, parameters.message)
  } else if (parameters.type === 'remove') {
    await commands.remove(parameters.path)
  }
}

start()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
