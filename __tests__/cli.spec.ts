/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import fs from 'fs'
import path from 'path'
import { describe, it, expect, afterAll, vi } from 'vitest'
import temp from 'temp'
import executeCommand from '../src/utils/executeCommand.js'
import { add, update, commit, remove, clearRepoCache } from '../src/commands.js'
import { createConfig, parseConfig } from '../src/config'
import latestHash from '../src/utils/git/latestHash.js'

const exists = async (file: string) => fs.promises.access(file)
  .then(() => true)
  .catch(() => false)

async function setupGit(
  gitFiles: Record<string, string>,
  dependencies: {
    repo?: string,
    hash?: string,
    remotePath: string,
    localPath: string,
  }[] = [],
) {
  if (process.env.CI) {
    await executeCommand('git', ['config', '--global', 'user.email', 'test@example.com'])
    await executeCommand('git', ['config', '--global', 'user.name', 'Test User'])
    await executeCommand('git', ['config', '--global', 'init.defaultBranch', 'main'])
  }

  const testFolder = temp.mkdirSync()
  const gitFolder = temp.mkdirSync()

  await executeCommand('git', ['init'], { cwd: gitFolder })
  await executeCommand('git', ['config', 'receive.denyCurrentBranch', 'ignore'], { cwd: gitFolder })
  for (const [file, content] of Object.entries(gitFiles)) {
    await fs.promises.writeFile(path.join(gitFolder, file), content)
  }

  await executeCommand('git', ['add', '.'], { cwd: gitFolder })
  await executeCommand('git', ['commit', '-m', 'initial commit'], { cwd: gitFolder })
  const hash = await latestHash(gitFolder)

  await fs.promises.writeFile(
    path.join(testFolder, 'blend.yml'),
    createConfig({
      dependencies: dependencies.map(dep => ({
        repo: dep.repo ?? gitFolder,
        hash: dep.hash ?? hash,
        remotePath: dep.remotePath,
        localPath: dep.localPath,
      })),
    }),
  )
  await expect(exists(path.join(testFolder, 'blend.yml'))).resolves.toBe(true)

  vi.spyOn(process, 'cwd').mockReturnValue(testFolder)
  if (dependencies.length > 0) await update()
  for (const dep of dependencies) {
    const localPath = path.join(testFolder, dep.localPath)
    await expect(exists(localPath)).resolves.toBe(true)
  }
  clearRepoCache()
  return { testFolder, gitFolder }
}

describe('blend cli', () => {
  describe('add', () => {
    it('should add a dependency', async () => {
      const { testFolder, gitFolder } = await setupGit({ 'test.txt': 'test' })
      await expect(add(gitFolder, 'test.txt')).resolves.not.toThrow()
      await expect(exists(path.join(testFolder, 'test.txt'))).resolves.toBe(true)

      await expect(exists(path.join(testFolder, 'blend.yml'))).resolves.toBe(true)
      const config = parseConfig(await fs.promises.readFile(
        path.join(testFolder, 'blend.yml'),
        'utf-8',
      ))
      expect(config).toMatchObject({
        dependencies: [{
          repo: gitFolder,
          remotePath: 'test.txt',
          localPath: 'test.txt',
        }],
      })
    })

    it('should add a dependency with a local path', async () => {
      const { testFolder, gitFolder } = await setupGit({ 'test.txt': 'test' })

      await expect(add(gitFolder, 'test.txt', 'test2.txt')).resolves.not.toThrow()
      await expect(exists(path.join(testFolder, 'test2.txt'))).resolves.toBe(true)

      await expect(exists(path.join(testFolder, 'blend.yml'))).resolves.toBe(true)
      const config = parseConfig(await fs.promises.readFile(
        path.join(testFolder, 'blend.yml'),
        'utf-8',
      ))
      expect(config).toMatchObject({
        dependencies: [{
          repo: gitFolder,
          remotePath: 'test.txt',
          localPath: 'test2.txt',
        }],
      })
    })

    it('should add a dependency with a branch', async () => {
      const { testFolder, gitFolder } = await setupGit({ 'test.txt': 'test' })

      await expect(add(`${gitFolder}#main`, 'test.txt', 'test3.txt')).resolves.not.toThrow()
      await expect(exists(path.join(testFolder, 'test3.txt'))).resolves.toBe(true)

      await expect(exists(path.join(testFolder, 'blend.yml'))).resolves.toBe(true)
      const config = parseConfig(await fs.promises.readFile(
        path.join(testFolder, 'blend.yml'),
        'utf-8',
      ))
      expect(config).toMatchObject({
        dependencies: [{
          repo: `${gitFolder}#main`,
          remotePath: 'test.txt',
          localPath: 'test3.txt',
        }],
      })
    })

    it('should fail if the local path already exists', async () => {
      const { testFolder, gitFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(testFolder, 'test2.txt'), 'test2')
      await expect(add(gitFolder, 'test2.txt')).rejects.toThrowError('already exists')
    })

    it('should fail if the dependency already exists', async () => {
      const { gitFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await expect(add(gitFolder, 'test.txt')).rejects.toThrowError('already exists')
    })

    it('should fail if the repository does not exist', async () => {
      await setupGit({ 'test.txt': 'test' })
      await expect(add('/tmp/does-not-exist', 'test.txt'))
        .rejects.toThrowError('Unable to access repository')
    })

    it('should fail if the remote path does not exist', async () => {
      const { gitFolder } = await setupGit({ 'test.txt': 'test' })
      await expect(add(gitFolder, 'does-not-exist'))
        .rejects.toThrowError('does not exist in the repository')
    })
  })

  describe('update', () => {
    it('should pass if there are no updates', async () => {
      await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await expect(update()).resolves.not.toThrow()
    })

    it('should update a dependency', async () => {
      const { testFolder, gitFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(gitFolder, 'test.txt'), 'test2')
      await executeCommand('git', ['add', '.'], { cwd: gitFolder })
      await executeCommand('git', ['commit', '-m', 'update'], { cwd: gitFolder })
      await expect(update()).resolves.not.toThrow()

      const localPath = path.join(testFolder, 'test.txt')
      await expect(exists(localPath)).resolves.toBe(true)
      await expect(fs.promises.readFile(localPath, 'utf-8')).resolves.toBe('test2')
    })

    it('should not update if there are local changes', async () => {
      const { testFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(testFolder, 'test.txt'), 'test2')
      await expect(update()).resolves.not.toThrow()
      await expect(fs.promises.readFile(path.join(testFolder, 'test.txt'), 'utf-8'))
        .resolves.toBe('test2')
    })

    it('should not update if there are local and remote changes', async () => {
      const { testFolder, gitFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(testFolder, 'test.txt'), 'test2')
      await fs.promises.writeFile(path.join(gitFolder, 'test.txt'), 'test3')
      await executeCommand('git', ['add', '.'], { cwd: gitFolder })
      await executeCommand('git', ['commit', '-m', 'update'], { cwd: gitFolder })

      await expect(update()).resolves.not.toThrow()
      await expect(fs.promises.readFile(path.join(testFolder, 'test.txt'), 'utf-8'))
        .resolves.toBe('test2')
    })

    it('should fail if there are no dependencies', async () => {
      await setupGit({ 'test.txt': 'test' })
      await expect(update()).rejects.toThrowError('No dependencies found')
    })

    it('should fail if the hash of a dependency can not be resolved in the remote', async () => {
      const { testFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
        hash: 'xxx',
      }])
      await expect(update()).rejects.toThrowError('does not exist in the repository')
      await expect(fs.promises.readFile(path.join(testFolder, 'test.txt'), 'utf-8'))
        .resolves.toBe('test')
    })

    it('should fail in an empty directory', async () => {
      const testFolder = temp.mkdirSync()
      vi.spyOn(process, 'cwd').mockReturnValue(testFolder)
      await expect(update()).rejects.toThrowError('No dependencies found')
    })
  })

  describe('commit', () => {
    it('should fail if the dependency has no changes', async () => {
      await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await expect(commit('test.txt', 'commit message')).rejects.toThrowError('has no changes')
    })

    it('should fail if the commit message is empty', async () => {
      await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await expect(commit('test.txt', '')).rejects.toThrowError('Please provide a commit message')
    })

    it('should commit a dependency', async () => {
      const { testFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(testFolder, 'test.txt'), 'test2')
      await expect(commit('test.txt', 'commit message')).resolves.not.toThrow()
    })

    it('should fail if the dependency does not exist', async () => {
      await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await expect(commit('does-not-exist', 'commit message'))
        .rejects.toThrowError('does not exist')
    })

    it('should fail if the provided path is not a dependency', async () => {
      const { testFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(testFolder, 'test2.txt'), 'test2')
      await expect(commit('test2.txt', 'commit')).rejects.toThrowError('is not a dependency')
    })

    it('should fail if there is a newer remote version', async () => {
      const { testFolder, gitFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(gitFolder, 'test.txt'), 'test3')
      await executeCommand('git', ['add', '.'], { cwd: gitFolder })
      await executeCommand('git', ['commit', '-m', 'update'], { cwd: gitFolder })

      await fs.promises.writeFile(path.join(testFolder, 'test.txt'), 'test2')
      await expect(commit('test.txt', 'commit')).rejects.toThrowError('has a newer remote version')
    })
  })

  describe('remove', () => {
    it('should remove a dependency', async () => {
      await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await expect(remove('test.txt')).resolves.not.toThrow()
    })

    it('should fail if the dependency does not exist', async () => {
      await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await expect(remove('does-not-exist')).rejects.toThrowError('does not exist')
    })

    it('should fail if the provided path is not a dependency', async () => {
      const { testFolder } = await setupGit({ 'test.txt': 'test' }, [{
        remotePath: 'test.txt',
        localPath: 'test.txt',
      }])
      await fs.promises.writeFile(path.join(testFolder, 'test2.txt'), 'test2')
      await expect(remove('test2.txt')).rejects.toThrowError('is not a dependency')
    })
  })

  afterAll(() => {
    temp.cleanupSync()
  })
})
