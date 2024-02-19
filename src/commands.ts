import fs from 'fs'
import path from 'path'
import tmp from 'tmp'
import { addDependencyIfNotExists, createConfig, getConfig } from './config'
import cloneRepo from './utils/git/cloneRepo'
import checkout from './utils/git/checkout'
import latestHash from './utils/git/latestHash'

async function cloneRepoAndCheckout(repo: string, destinationPath: string) {
  const [repoUrl, branch = ''] = repo.split('#')
  await cloneRepo(repoUrl, destinationPath)
  if (branch !== '') {
    await checkout(destinationPath, branch)
  }
}

export async function add(repo: string, remotePath: string, localPath: string) {
  const tempDir = tmp.dirSync({ unsafeCleanup: true })
  const repoPath = tempDir.name
  await cloneRepoAndCheckout(repo, repoPath)
  const fullRemotePath = path.join(repoPath, remotePath)
  const commitHash = await latestHash(repoPath)

  // const packageConfig = await getConfig(fullRemotePath)
  const localConfigPath = path.join(process.cwd(), 'blend.yml')
  const localConfig = addDependencyIfNotExists((await getConfig(localConfigPath)) || {
    name: undefined,
    description: undefined,
    hooks: undefined,
    dependencies: [],
  }, {
    repo,
    hash: commitHash,
    localPath,
    remotePath,
  })
  localConfig.dependencies = localConfig.dependencies || []
  localConfig.dependencies.push()
  // Write the new config to the local blend.yaml
  await fs.promises.writeFile(localConfigPath, createConfig(localConfig), 'utf-8')

  // Print files in temp dir
  fs.readdirSync(repoPath).forEach((entry) => {
    console.log(path.join(repoPath, entry))
  })

  const localDir = localPath ? path.join(process.cwd(), localPath) : process.cwd()
  await fs.promises.cp(fullRemotePath, localDir, {
    recursive: true,
  })
}

export async function update() {
  console.log('Updating...')
}

export async function remove(path: string) {
  console.log(`Removing: ${path}`)
}
