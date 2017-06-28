jest.resetAllMocks()
jest.resetModules()

const { DEFAULT_PLUGIN_BRANCH } = require.requireActual('../../constants')

const { parseDependencyVersion, findInList } = require.requireActual('../plugin')

describe('plugin utils', () => {
  it('should failed parse version', () => {
    expect(parseDependencyVersion('')).toBe(DEFAULT_PLUGIN_BRANCH)
  })

  it('should find plugin in list', () => {
    const plugin = {
      name: 'name',
      packageName: 'packageName',
      packageAlias: 'packageAlias',
    }

    expect(findInList(plugin.name, [plugin])).toBe(plugin)
    expect(findInList(plugin.packageName, [plugin])).toBe(plugin)
    expect(findInList(plugin.packageAlias, [plugin])).toBe(plugin)
  })
})
