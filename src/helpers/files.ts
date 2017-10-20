import * as fs from 'fs-extra'

export function readJson<T extends object = {}>(jsonPath: string, throws = false): T {
  const json: T | undefined = fs.readJsonSync(jsonPath, { throws })
  if (typeof json === 'object') {
    return json as T
  } else {
    return {} as T
  }
}
