import { cp, lstat, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MANIFEST_NAME = '.pi-devflow-manifest.json'
const MANIFEST_VERSION = 1
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RENAMABLE_ERRORS = new Set(['EEXIST', 'ENOTEMPTY', 'EPERM'])

export function resolveDshHome({ dshHome = process.env.DSH_HOME, homeDirectory = homedir() } = {}) {
  return resolve(dshHome?.trim() || join(homeDirectory, '.dsh'))
}

export async function syncGlobalSkills({
  sourceRoot = fileURLToPath(new URL('../skills/', import.meta.url)),
  dshHome,
} = {}) {
  const source = resolve(sourceRoot)
  const home = resolveDshHome({ dshHome })
  const targetRoot = join(home, 'skills')
  const manifestPath = join(targetRoot, MANIFEST_NAME)

  const skills = await discoverSkills(source)
  await ensureTargetRoot(targetRoot)
  const previous = await readManifest(manifestPath)
  await checkConflicts(targetRoot, skills, previous.skills)

  const stagingRoot = await mkdtemp(join(home, '.pi-devflow-staging-'))
  let backupRoot
  try {
    backupRoot = await mkdtemp(join(home, '.pi-devflow-backup-'))
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true })
    throw error
  }
  let committed = false
  const movedPreviousNames = []
  const installedNames = []
  try {
    for (const skill of skills) {
      await cp(skill.source, join(stagingRoot, skill.name), { recursive: true, errorOnExist: true })
    }

    for (const name of previous.skills) {
      const target = join(targetRoot, name)
      if (await existingPath(target) !== undefined) {
        await rename(target, join(backupRoot, name))
        movedPreviousNames.push(name)
      }
    }

    for (const skill of skills) {
      await rename(join(stagingRoot, skill.name), join(targetRoot, skill.name))
      installedNames.push(skill.name)
    }

    await writeManifest(manifestPath, skills.map(skill => skill.name))
    committed = true
  } catch (error) {
    if (!committed) await rollback(targetRoot, stagingRoot, backupRoot, installedNames, movedPreviousNames)
    throw error
  } finally {
    await rm(stagingRoot, { recursive: true, force: true })
    await rm(backupRoot, { recursive: true, force: true })
  }

  return { dshHome: home, skills: skills.map(skill => skill.name) }
}

async function discoverSkills(sourceRoot) {
  const entries = await readdir(sourceRoot, { withFileTypes: true })
  const skills = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!SKILL_NAME.test(entry.name)) {
      throw new Error(`source validation failed: invalid skill directory name: ${join(sourceRoot, entry.name)}`)
    }
    if (!entry.isDirectory()) {
      throw new Error(`source validation failed: skill entry is not a directory: ${join(sourceRoot, entry.name)}`)
    }
    const skillRoot = join(sourceRoot, entry.name)
    const marker = join(skillRoot, 'SKILL.md')
    const markerInfo = await existingPath(marker)
    if (markerInfo === undefined || !markerInfo.isFile() || markerInfo.isSymbolicLink()) {
      throw new Error(`source validation failed: missing regular SKILL.md: ${marker}`)
    }
    skills.push({ name: entry.name, source: skillRoot })
  }
  return skills
}

async function ensureTargetRoot(targetRoot) {
  const info = await existingPath(targetRoot)
  if (info?.isSymbolicLink()) {
    throw new Error(`target validation failed: skills directory is a symbolic link: ${targetRoot}`)
  }
  if (info !== undefined && !info.isDirectory()) {
    throw new Error(`target validation failed: skills path is not a directory: ${targetRoot}`)
  }
  await mkdir(targetRoot, { recursive: true })
}

async function readManifest(manifestPath) {
  const info = await existingPath(manifestPath)
  if (info?.isSymbolicLink()) {
    throw new Error(`manifest validation failed: manifest is a symbolic link: ${manifestPath}`)
  }
  if (info !== undefined && !info.isFile()) {
    throw new Error(`manifest validation failed: manifest is not a regular file: ${manifestPath}`)
  }

  let content
  try {
    content = await readFile(manifestPath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: MANIFEST_VERSION, skills: [] }
    throw new Error(`manifest read failed: ${manifestPath}: ${error.message}`, { cause: error })
  }

  let manifest
  try {
    manifest = JSON.parse(content)
  } catch (error) {
    throw new Error(`manifest validation failed: invalid JSON: ${manifestPath}`, { cause: error })
  }
  if (!isValidManifest(manifest)) {
    throw new Error(`manifest validation failed: expected version 1 and unique skill names: ${manifestPath}`)
  }
  return manifest
}

function isValidManifest(value) {
  return value !== null
    && typeof value === 'object'
    && value.version === MANIFEST_VERSION
    && Array.isArray(value.skills)
    && value.skills.every(name => typeof name === 'string' && SKILL_NAME.test(name))
    && new Set(value.skills).size === value.skills.length
    && [...value.skills].sort().every((name, index) => name === value.skills[index])
}

async function checkConflicts(targetRoot, skills, managedNames) {
  const managed = new Set(managedNames)
  for (const skill of skills) {
    const target = join(targetRoot, skill.name)
    const info = await existingPath(target)
    if (info === undefined) continue
    if (!managed.has(skill.name)) {
      throw new Error(`sync conflict: target is not managed by pi-devflow: ${target}`)
    }
    if (info.isSymbolicLink()) {
      throw new Error(`sync conflict: managed skill is a symbolic link: ${target}`)
    }
  }
  for (const name of managedNames) {
    const target = join(targetRoot, name)
    const info = await existingPath(target)
    if (info?.isSymbolicLink()) {
      throw new Error(`sync cleanup conflict: managed skill is a symbolic link: ${target}`)
    }
  }
}

async function rollback(targetRoot, stagingRoot, backupRoot, installedNames, movedPreviousNames) {
  for (const name of installedNames) {
    await rm(join(targetRoot, name), { recursive: true, force: true })
  }
  for (const name of movedPreviousNames) {
    const backup = join(backupRoot, name)
    if (await existingPath(backup) !== undefined) {
      await rename(backup, join(targetRoot, name))
    }
  }
  await rm(stagingRoot, { recursive: true, force: true })
}

async function writeManifest(manifestPath, skills) {
  const temporary = `${manifestPath}.${process.pid}.${Date.now()}.tmp`
  try {
    await writeFile(temporary, `${JSON.stringify({ version: MANIFEST_VERSION, skills }, null, 2)}\n`, 'utf8')
  } catch (error) {
    await rm(temporary, { force: true })
    throw new Error(`manifest write failed: ${manifestPath}: ${error.message}`, { cause: error })
  }
  try {
    await rename(temporary, manifestPath)
  } catch (error) {
    if (!RENAMABLE_ERRORS.has(error?.code)) {
      await rm(temporary, { force: true })
      throw new Error(`manifest write failed: ${manifestPath}: ${error.message}`, { cause: error })
    }

    const backup = `${manifestPath}.${process.pid}.${Date.now()}.backup`
    try {
      await rename(manifestPath, backup)
      try {
        await rename(temporary, manifestPath)
      } catch (replaceError) {
        await rename(backup, manifestPath)
        throw replaceError
      }
      await rm(backup, { force: true })
    } catch (replaceError) {
      await rm(temporary, { force: true })
      throw new Error(`manifest write failed: ${manifestPath}: ${replaceError.message}`, { cause: replaceError })
    }
  }
}

async function existingPath(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }
}

export { MANIFEST_NAME }
