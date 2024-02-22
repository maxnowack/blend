import fs from 'node:fs'
import path from 'node:path'
import pMap from 'p-map'
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

export async function add(repo: string, remotePath: string, localPath = remotePath) {
  const repoPath = await cloneRepoAndCheckout(repo)
  const fullRemotePath = path.join(repoPath, remotePath)
  const commitHash = await latestHash(repoPath)

  // const packageConfig = await getConfig(fullRemotePath)
  const localConfig = addDependencyIfNotExists(await getLocalConfig(), {
    repo,
    hash: commitHash,
    localPath,
    remotePath,
  })

  const localDir = localPath
    ? path.join(await getLocalConfigDir(), localPath)
    : await getLocalConfigDir()
  await fs.promises.cp(fullRemotePath, localDir, {
    recursive: true,
  })

  await saveLocalConfig(localConfig)
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
  const localConfig = await getLocalConfig()
  const dependency = localConfig.dependencies?.find(dep => dep.localPath === localPath)
  const pathExists = await exists(localPath)
  if (!dependency) return { found: false, pathExists }
  if (!pathExists) return { found: true, pathExists: false }

  const repoPath = await cloneRepoAndCheckout(dependency.repo)
  const commitHash = await latestHash(repoPath)
  const upToDate = commitHash === dependency.hash

  await checkout(repoPath, dependency.hash)
  const fullRemotePath = path.join(repoPath, dependency.remotePath)
  const localDir = localPath
    ? path.join(await getLocalConfigDir(), localPath)
    : await getLocalConfigDir()
  await fs.promises.cp(localDir, fullRemotePath, {
    recursive: true,
  })

  const hasLocalChanges = await hasChanges(fullRemotePath)
  const branch = getUrlAndBranch(dependency.repo).branch || await remoteDefaultBranch(repoPath)
  await reset(repoPath, branch)
  const hasNewerVersion = !upToDate && await isAncestor(dependency.hash, commitHash, repoPath)

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
  console.log(`Updating ${dependencies.length} dependencies ...`)
  const newDependencies: NonNullable<(typeof localConfig)['dependencies']> = []
  await pMap(dependencies, async (dependency) => {
    const {
      pathExists,
      upToDate,
      hasLocalChanges,
      hasNewerVersion,
    } = await statusCheck(dependency.localPath)

    if (!pathExists) {
      console.log(`${dependency.localPath} does not exist. Removing dependency ...`)
      return
    }

    if (hasLocalChanges) {
      if (hasNewerVersion) {
        console.log(`${dependency.localPath} has changes and a newer remote version. Please first update to the new remote version manually and start commiting your changes. Skipping ...`)
      } else {
        console.log(`${dependency.localPath} has changes. Please commit them using 'blend commit ${dependency.localPath} "<commit message>"' Skipping ...`)
      }
      newDependencies.push(dependency)
      return
    }

    if (upToDate) {
      console.log(`${dependency.localPath} is up to date. Skipping ...`)
      newDependencies.push(dependency)
      return
    }

    console.log(`Updating ${dependency.localPath} ...`)

    const repoPath = await cloneRepoAndCheckout(dependency.repo)
    const fullRemotePath = path.join(repoPath, dependency.remotePath)

    const localDir = dependency.localPath
      ? path.join(await getLocalConfigDir(), dependency.localPath)
      : await getLocalConfigDir()
    await fs.promises.cp(fullRemotePath, localDir, {
      recursive: true,
    })

    const commitHash = await latestHash(repoPath)
    newDependencies.push({
      ...dependency,
      hash: commitHash,
    })
  }, { concurrency: 5 })

  // Write the new config to the local blend.yaml
  await saveLocalConfig({
    ...localConfig,
    dependencies: newDependencies,
  })
}

export async function commit(localPath: string, message: string) {
  console.log(`Committing ${localPath} ...`)
  const {
    found,
    pathExists,
    hasLocalChanges,
    hasNewerVersion,
  } = await statusCheck(localPath)

  if (!pathExists) {
    console.error(`Path ${localPath} does not exist`)
    return
  }
  if (!found) {
    console.error(`Path ${localPath} is not a dependency`)
    return
  }

  if (!hasLocalChanges) {
    console.error(`Path ${localPath} has no changes`)
    return
  }

  if (hasNewerVersion) {
    console.error(`Path ${localPath} has a newer remote version. Please update to the new remote version manually first`)
    return
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

export async function remove(filePath: string) {
  if (!(await exists(filePath))) {
    console.error(`${filePath} does not exist`)
    return
  }

  console.log(`Removing ${filePath} ...`)
  const localConfig = await getLocalConfig()
  localConfig.dependencies = (localConfig.dependencies || [])
  const dependencyIndex = localConfig.dependencies.findIndex(dep => dep.localPath === filePath)
  if (dependencyIndex === -1) {
    console.error(`${filePath} is not a dependency`)
    return
  }
  localConfig.dependencies.splice(dependencyIndex, 1)

  await fs.promises.unlink(filePath)
  await saveLocalConfig(localConfig)
}
