jest.mock('cross-spawn')

const mockCrossSpawn = require.requireMock('cross-spawn')

const { DEFAULT_PLUGIN_BRANCH } = require.requireActual('../../constants')

const { parseDependencyVersion, publishToNpm, compareVersions } = require.requireActual('../plugin')

describe('plugin utils', () => {
  const cwd = '/cwd'
  it('should failed parse version', () => {
    expect(parseDependencyVersion('')).toBe(DEFAULT_PLUGIN_BRANCH)
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
