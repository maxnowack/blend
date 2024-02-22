import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import exists from './utils/fileExists.js'

interface Dependency {
  repo: string,
  hash: string,
  remotePath: string,
  localPath: string,
}

interface Hooks {
  preinstall?: string,
  postinstall?: string,
  preuninstall?: string,
  postuninstall?: string,
}

interface Config {
  name?: string,
  description?: string,
  hooks?: Hooks,
  dependencies?: Dependency[],
}

function extractFirstBlockComment(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const blockCommentRegex = /\/\*(.*?)\*\//s
    const match = content.match(blockCommentRegex)
    return match ? match[1].trim() : null
  } catch (err) {
    console.error(`Failed to read file: ${filePath}`, err)
    return null
  }
}

export function parseConfig(yamlString: string): Config {
  return yaml.load(yamlString) as Config
}

export function createConfig(config: Config): string {
  return yaml.dump(config)
}

export function addDependencyIfNotExists(config: Config, dependency: Dependency) {
  const newConfig = { ...config }
  if (!newConfig.dependencies) {
    newConfig.dependencies = []
  }
  if (!newConfig.dependencies.some(dep => dep.localPath === dependency.localPath)) {
    newConfig.dependencies.push(dependency)
  } else {
    console.log(`Dependency with local path ${dependency.localPath} already exists. Dependency not added.`)
  }
  return newConfig
}
export async function getConfig(filePath: string): Promise<Config | null> {
  if (!(await exists(filePath))) return null
  if (path.basename(filePath) === 'blend.yml') {
    const yamlContent = fs.readFileSync(filePath, 'utf-8')
    return parseConfig(yamlContent)
  }
  const stats = await fs.promises.stat(filePath)
  if (stats.isDirectory()) {
    const blendYmlPath = path.join(filePath, 'blend.yml')
    if (await exists(blendYmlPath)) {
      const yamlContent = fs.readFileSync(blendYmlPath, 'utf-8')
      return parseConfig(yamlContent)
    }
    throw new Error(`File not found: ${blendYmlPath}`)
  }

  const comment = extractFirstBlockComment(filePath)
  if (comment) return parseConfig(comment)
  return null
}

export async function getLocalConfigDir() {
  return Promise.resolve(process.cwd())
}

export async function getLocalConfigPath() {
  return Promise.resolve(path.join(await getLocalConfigDir(), 'blend.yml'))
}

export async function getLocalConfig() {
  const localConfigPath = await getLocalConfigPath()
  return (await getConfig(localConfigPath)) || {
    name: undefined,
    description: undefined,
    hooks: undefined,
    dependencies: [],
  }
}

export async function saveLocalConfig(config: Config) {
  const localConfigPath = await getLocalConfigPath()
  await fs.promises.writeFile(localConfigPath, createConfig(config), 'utf-8')
}
