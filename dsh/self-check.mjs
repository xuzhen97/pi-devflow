import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveDshHome, syncGlobalSkills } from './sync.mjs'

async function withTempRoot(callback) {
  const root = await mkdtemp(join(tmpdir(), 'pi-devflow-self-check-'))
  try {
    return await callback(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function writeSkill(sourceRoot, name, body, resource) {
  const directory = join(sourceRoot, name)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'SKILL.md'), body)
  if (resource !== undefined) {
    await mkdir(join(directory, 'references'), { recursive: true })
    await writeFile(join(directory, 'references', 'note.txt'), resource)
  }
}

async function testPackageSurface(root) {
  const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
  const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
  assert.equal(packageJson.main, './dsh/index.mjs')
  assert.equal(packageJson.exports['./dsh'], './dsh/index.mjs')
  assert.equal(packageJson.dsh.bundle.patch, './dsh/cordis.patch.yml')
  assert.equal(packageJson.scripts.postinstall, 'node ./dsh/install.mjs')
  const patchLines = (await readFile(join(packageRoot, 'dsh', 'cordis.patch.yml'), 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  assert.deepEqual(patchLines, [
    '- insert:',
    '- id: pi-devflow-global-skills',
    'name: pi-devflow/dsh',
  ])

  const dshPlugin = await import('./index.mjs')
  assert.equal(dshPlugin.name, 'pi-devflow-global-skills')
  const runtimeHome = join(root, 'runtime-dsh-home')
  const previousDshHome = process.env.DSH_HOME
  process.env.DSH_HOME = runtimeHome
  try {
    assert.equal(await dshPlugin.apply(), undefined)
    assert.match(await readFile(join(runtimeHome, 'skills', 'brainstorming', 'SKILL.md'), 'utf8'), /name: brainstorming/)
  } finally {
    if (previousDshHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousDshHome
  }
}

async function testSyncLifecycle() {
  await withTempRoot(async (root) => {
    const sourceRoot = join(root, 'source')
    const dshHome = join(root, 'dsh-home')
    await writeSkill(sourceRoot, 'alpha', 'alpha-old', 'resource')
    await writeSkill(sourceRoot, 'beta', 'beta')

    const first = await syncGlobalSkills({ sourceRoot, dshHome })
    assert.deepEqual(first, { dshHome: resolve(dshHome), skills: ['alpha', 'beta'] })
    assert.equal(await readFile(join(dshHome, 'skills', 'alpha', 'SKILL.md'), 'utf8'), 'alpha-old')
    assert.equal(await readFile(join(dshHome, 'skills', 'alpha', 'references', 'note.txt'), 'utf8'), 'resource')

    const unchanged = await syncGlobalSkills({ sourceRoot, dshHome })
    assert.deepEqual(unchanged.skills, ['alpha', 'beta'])

    await writeFile(join(sourceRoot, 'alpha', 'SKILL.md'), 'alpha-new')
    await rm(join(sourceRoot, 'beta'), { recursive: true })
    const updated = await syncGlobalSkills({ sourceRoot, dshHome })
    assert.deepEqual(updated.skills, ['alpha'])
    assert.equal(await readFile(join(dshHome, 'skills', 'alpha', 'SKILL.md'), 'utf8'), 'alpha-new')
    await assert.rejects(readFile(join(dshHome, 'skills', 'beta', 'SKILL.md'), 'utf8'))

    const manifest = JSON.parse(await readFile(join(dshHome, 'skills', '.pi-devflow-manifest.json'), 'utf8'))
    assert.deepEqual(manifest, { version: 1, skills: ['alpha'] })
  })
}

async function testConflictProtection() {
  await withTempRoot(async (root) => {
    const sourceRoot = join(root, 'source')
    const dshHome = join(root, 'dsh-home')
    await writeSkill(sourceRoot, 'alpha', 'source')
    await mkdir(join(dshHome, 'skills', 'alpha'), { recursive: true })
    await writeFile(join(dshHome, 'skills', 'alpha', 'SKILL.md'), 'user-content')

    await assert.rejects(
      syncGlobalSkills({ sourceRoot, dshHome }),
      (error) => error instanceof Error && error.message.includes('alpha') && error.message.includes('conflict'),
    )
    assert.equal(await readFile(join(dshHome, 'skills', 'alpha', 'SKILL.md'), 'utf8'), 'user-content')
  })
}

async function testManifestValidation() {
  await withTempRoot(async (root) => {
    const sourceRoot = join(root, 'source')
    const dshHome = join(root, 'dsh-home')
    const manifestPath = join(dshHome, 'skills', '.pi-devflow-manifest.json')
    await writeSkill(sourceRoot, 'alpha', 'source')
    await mkdir(join(dshHome, 'skills'), { recursive: true })

    for (const value of [
      '{"version":2,"skills":["alpha"]}',
      '{"version":1,"skills":["alpha","alpha"]}',
      '{"version":1,"skills":["../alpha"]}',
      '{"version":1,"skills":"alpha"}',
    ]) {
      await writeFile(manifestPath, value)
      await assert.rejects(syncGlobalSkills({ sourceRoot, dshHome }))
    }
  })
}

async function testPathAndSourceValidation() {
  assert.equal(resolveDshHome({ dshHome: '', homeDirectory: '/tmp/example-home' }), resolve('/tmp/example-home/.dsh'))
  assert.equal(resolveDshHome({ dshHome: 'relative-dsh', homeDirectory: '/tmp/example-home' }), resolve('relative-dsh'))

  await withTempRoot(async (root) => {
    const dshHome = join(root, 'dsh-home')
    const invalidRoots = [
      async (sourceRoot) => await writeFile(join(sourceRoot, 'not-a-directory.md'), 'invalid'),
      async (sourceRoot) => await mkdir(join(sourceRoot, 'missing-skill'), { recursive: true }),
      async (sourceRoot) => await mkdir(join(sourceRoot, 'Bad_Name'), { recursive: true }),
    ]

    for (const prepare of invalidRoots) {
      const sourceRoot = join(root, `source-${invalidRoots.indexOf(prepare)}`)
      await mkdir(sourceRoot, { recursive: true })
      await prepare(sourceRoot)
      await assert.rejects(syncGlobalSkills({ sourceRoot, dshHome }))
    }
  })
}

async function testSymlinkProtection() {
  if (process.platform === 'win32') return

  await withTempRoot(async (root) => {
    const sourceRoot = join(root, 'source')
    const dshHome = join(root, 'dsh-home')
    const outside = join(root, 'outside')
    await writeSkill(sourceRoot, 'alpha', 'source')
    await mkdir(outside, { recursive: true })
    await mkdir(join(dshHome, 'skills'), { recursive: true })
    await symlink(outside, join(dshHome, 'skills', 'alpha'), 'junction')

    await assert.rejects(syncGlobalSkills({ sourceRoot, dshHome }))
    assert.deepEqual(await readdir(outside), [])
  })
}

await withTempRoot(async (root) => {
  await testPackageSurface(root)
})
await testSyncLifecycle()
await testConflictProtection()
await testManifestValidation()
await testPathAndSourceValidation()
await testSymlinkProtection()
console.log('pi-devflow dsh synchronizer self-check passed')
