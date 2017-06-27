jest.resetAllMocks()
jest.resetModules()

const { DEFAULT_PLUGIN_BRANCH } = require.requireActual('../../constants')

const { parseDependencyVersion } = require.requireActual('../plugin')

describe('plugin utils', () => {
  it('should failed parse version', () => {
    expect(parseDependencyVersion('')).toBe(DEFAULT_PLUGIN_BRANCH)
  })
})
