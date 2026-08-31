import { syncGlobalSkills } from './sync.mjs'

const result = await syncGlobalSkills()
console.log(`[pi-devflow] synced ${result.skills.length} global skills to ${result.dshHome}`)
