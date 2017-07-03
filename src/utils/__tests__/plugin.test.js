jest.mock('cross-spawn')

const mockCrossSpawn = require.requireMock('cross-spawn')

const { DEFAULT_PLUGIN_BRANCH } = require.requireActual('../../constants')

const { parseDependencyVersion, findInList, publishToNpm, compareVersions } = require.requireActual('../plugin')

describe('plugin utils', () => {
  const cwd = '/cwd'
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

  describe('publishToNpm', () => {
    it('should work correctly', () => {
      publishToNpm(cwd)

      expect(mockCrossSpawn.sync).toBeCalledWith(
        'npm',
        ['publish', './', '--access=public'],
        { cwd, stdio: 'inherit' }
      )
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => publishToNpm(cwd)).toThrow('Failed publish to npm')
    })
  })

  describe('compareVersions', () => {
    it('should detect major different', () => {
      const version1 = {
        major: 1,
        minor: 0,
        patch: 0,
      }
      const version2 = {
        major: 2,
        minor: 0,
        patch: 0,
      }
      expect(compareVersions(version1, version2)).toBeLessThan(0)
    })

    it('should detect minor different', () => {
      const version1 = {
        major: 1,
        minor: 2,
        patch: 0,
      }
      const version2 = {
        major: 1,
        minor: 0,
        patch: 0,
      }
      expect(compareVersions(version1, version2)).toBeGreaterThan(0)
    })

    it('should detect patch different', () => {
      const version1 = {
        major: 1,
        minor: 0,
        patch: 0,
      }
      const version2 = {
        major: 1,
        minor: 0,
        patch: 1,
      }
      expect(compareVersions(version1, version2)).toBeLessThan(0)
    })
  })
})
