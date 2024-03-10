import fs from 'node:fs'
import path from 'node:path'
import temp from 'temp'
import {
  addDependencyIfNotExists,
  getLocalConfig,
  getLocalConfigDir,
  saveLocalConfig,
} from './config.js'
import cloneRepo from './utils/git/cloneRepo.js'
import checkout from './utils/git/checkout.js'
import latestHash from './utils/git/latestHash.js'
import exists from './utils/fileExists.js'
import isAncestor from './utils/git/isAncestor.js'
import hasChanges from './utils/git/hasChanges.js'
import commitChanges from './utils/git/commit.js'
import reset from './utils/git/reset.js'
import remoteDefaultBranch from './utils/git/remoteDefaultBranch.js'

function getUrlAndBranch(repo: string): { url: string, branch?: string } {
  const [url, branch] = repo.split('#')
  return { url, branch }
}

const repoCache = new Map<string, string>()
async function cloneRepoAndCheckout(repo: string) {
  if (!repoCache.has(repo)) {
    const destinationPath = temp.mkdirSync()
    const { url, branch } = getUrlAndBranch(repo)
    await cloneRepo(url, destinationPath)
    if (branch != null) {
      await checkout(destinationPath, branch)
    }
    repoCache.set(repo, destinationPath)
  }
  return repoCache.get(repo) as string
}
export function clearRepoCache() {
  repoCache.clear()
}

export async function add(
  repo: string,
  remotePath: string,
  localPath = remotePath,
  addToConfig = true,
) {
  console.log(`Adding ${localPath} ...`) // eslint-disable-line no-console
  const localDir = path.join(await getLocalConfigDir(), localPath)
  if (await exists(localDir)) {
    throw new Error(`${localPath} already exists! Please remove it first`)
  }

  const repoPath = await cloneRepoAndCheckout(repo)
  const fullRemotePath = path.join(repoPath, remotePath)
  if (!(await exists(fullRemotePath))) {
    throw new Error(`Path ${remotePath} does not exist in the repository`)
  }
  const commitHash = await latestHash(repoPath)

  await fs.promises.cp(fullRemotePath, localDir, {
    recursive: true,
  })

  if (addToConfig) {
    const localConfig = addDependencyIfNotExists(await getLocalConfig(), {
      repo,
      hash: commitHash,
      localPath,
      remotePath,
    })
    await saveLocalConfig(localConfig)
  }
}

async function statusCheck(localPath: string): Promise<{
  found: true,
  pathExists: false,
  upToDate?: never,
  hasLocalChanges?: never,
  hasNewerVersion?: never,
} | {
  found: false,
  pathExists: boolean,
  upToDate?: never,
  hasLocalChanges?: never,
  hasNewerVersion?: never,
} | {
  found: true,
  pathExists: true,
  upToDate: boolean,
  hasLocalChanges: boolean,
  hasNewerVersion: boolean,
}> {
  const localDir = path.join(await getLocalConfigDir(), localPath)
  const localConfig = await getLocalConfig()
  const dependency = localConfig.dependencies?.find(dep => dep.localPath === localPath)
  const pathExists = await exists(localDir)
  if (!dependency) return { found: false, pathExists }
  if (!pathExists) return { found: true, pathExists: false }

  const repoPath = await cloneRepoAndCheckout(dependency.repo)
  const commitHash = await latestHash(repoPath)
  const upToDate = commitHash === dependency.hash

  const hasNewerVersion = !upToDate && await isAncestor(dependency.hash, commitHash, repoPath)
  await checkout(repoPath, dependency.hash)
  const fullRemotePath = path.join(repoPath, dependency.remotePath)
  await fs.promises.cp(localDir, fullRemotePath, {
    recursive: true,
  })

  const hasLocalChanges = await hasChanges(fullRemotePath)
  const branch = getUrlAndBranch(dependency.repo).branch || await remoteDefaultBranch(repoPath)
  await reset(repoPath, branch)

  return {
    found: true,
    pathExists: true,
    upToDate,
    hasLocalChanges,
    hasNewerVersion,
  }
}

export async function update() {
  const localConfig = await getLocalConfig()
  const dependencies = localConfig.dependencies || []
  if (dependencies.length === 0) {
    throw new Error('No dependencies found')
  }
  console.log(`Updating ${dependencies.length} dependencies ...`) // eslint-disable-line no-console
  const newDependencies: NonNullable<(typeof localConfig)['dependencies']> = []
  await dependencies.reduce(async (promise, dependency) => {
    await promise
    const {
      pathExists,
      upToDate,
      hasLocalChanges,
      hasNewerVersion,
    } = await statusCheck(dependency.localPath)

    if (!pathExists) {
      console.log(`${dependency.localPath} does not exist.`) // eslint-disable-line no-console
      await add(dependency.repo, dependency.remotePath, dependency.localPath, false)
      newDependencies.push(dependency)
      return
    }

    if (hasLocalChanges) {
      if (hasNewerVersion) {
        console.log(`${dependency.localPath} has changes and a newer remote version. Please first update to the new remote version manually and start commiting your changes. Skipping ...`) // eslint-disable-line no-console
      } else {
        console.log(`${dependency.localPath} has changes. Please commit them using 'blend commit ${dependency.localPath} "<commit message>"' Skipping ...`) // eslint-disable-line no-console
      }
      newDependencies.push(dependency)
      return
    }

    if (upToDate) {
      console.log(`${dependency.localPath} is up to date. Skipping ...`) // eslint-disable-line no-console
      newDependencies.push(dependency)
      return
    }

    console.log(`Updating ${dependency.localPath} ...`) // eslint-disable-line no-console

    const repoPath = await cloneRepoAndCheckout(dependency.repo)
    const fullRemotePath = path.join(repoPath, dependency.remotePath)

    const localDir = path.join(await getLocalConfigDir(), dependency.localPath)
    await fs.promises.cp(fullRemotePath, localDir, {
      recursive: true,
    })

    const commitHash = await latestHash(repoPath)
    newDependencies.push({
      ...dependency,
      hash: commitHash,
    })
  }, Promise.resolve())

  // Write the new config to the local blend.yaml
  await saveLocalConfig({
    ...localConfig,
    dependencies: newDependencies,
  })
}

export async function commit(localPath: string, message: string) {
  console.log(`Committing ${localPath} ...`) // eslint-disable-line no-console
  const {
    found,
    pathExists,
    hasLocalChanges,
    hasNewerVersion,
  } = await statusCheck(localPath)

  if (!message) {
    throw new Error('Please provide a commit message')
  }

  if (!pathExists) {
    throw new Error(`Path ${localPath} does not exist`)
  }
  if (!found) {
    throw new Error(`Path ${localPath} is not a dependency`)
  }

  if (!hasLocalChanges) {
    throw new Error(`Path ${localPath} has no changes`)
  }

  if (hasNewerVersion) {
    throw new Error(`Path ${localPath} has a newer remote version. Please update to the new remote version manually first`)
  }

  const localConfig = await getLocalConfig()
  const dependency = localConfig.dependencies?.find(dep => dep.localPath === localPath)
  if (!dependency) throw new Error('Dependency not found')

  const repoPath = await cloneRepoAndCheckout(dependency.repo)
  const fullRemotePath = path.join(repoPath, dependency.remotePath)
  const fullLocalPath = path.join(await getLocalConfigDir(), localPath)
  await fs.promises.cp(fullLocalPath, fullRemotePath, {
    recursive: true,
    force: true,
  })

  await commitChanges(repoPath, message)

  const commitHash = await latestHash(repoPath)
  await saveLocalConfig({
    ...localConfig,
    dependencies: (localConfig.dependencies || []).map((dep) => {
      if (dep.localPath !== localPath) return dep
      return {
        ...dep,
        hash: commitHash,
      }
    }),
  })
}

export async function remove(localPath: string) {
  const filePath = path.join(await getLocalConfigDir(), localPath)
  if (!(await exists(filePath))) {
    throw new Error(`${localPath} does not exist`)
  }

  console.log(`Removing ${localPath} ...`) // eslint-disable-line no-console
  const localConfig = await getLocalConfig()
  localConfig.dependencies = (localConfig.dependencies || [])
  const dependencyIndex = localConfig.dependencies.findIndex(dep => dep.localPath === localPath)
  if (dependencyIndex === -1) {
    throw new Error(`${localPath} is not a dependency`)
  }
  localConfig.dependencies.splice(dependencyIndex, 1)

  await fs.promises.unlink(filePath)
  await saveLocalConfig(localConfig)
}
