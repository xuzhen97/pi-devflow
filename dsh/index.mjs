import { syncGlobalSkills } from './sync.mjs'

export const name = 'pi-devflow-global-skills'

export async function apply() {
  await syncGlobalSkills()
}
