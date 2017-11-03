jest.mock('cross-spawn')
jest.mock('fs-extra')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockFs = require.requireMock('fs-extra')

const { DEFAULT_PLUGIN_BRANCH, PACKAGE_JSON_PATH } = require.requireActual('../../constants')
const path = require.requireActual('path')

const {
  parseDependencyVersion,
  publishToNpm,
  compareVersions,
  getPluginName,
  findPluginForInstall,
  addDevDependency,
  removeDevDependency,
} = require.requireActual('../plugin')

describe('plugin utils', () => {
  beforeEach(() => {
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
  })

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

  describe('getPluginName', () => {
    it('should failed get name - invalid type', () => {
      expect(() => getPluginName('')).toThrowError('Invalid plugin type')
    })

    it('should failed get name - cant find name', () => {
      expect(() => getPluginName({})).toThrowError('Plugin does not contain name')
    })
  })

  describe('findPluginForInstall', () => {
    it('should failed find plugin - invalid type', () => {
      expect(() => findPluginForInstall(10, [])).toThrowError('Invalid plugin type')
    })
  })

  describe('addDevDependency', () => {
    it('should failed read package.json', () => {
      expect(() => addDevDependency('', '', '')).toThrowError('Failed read `package.json`')
    })

    it('should failed read package.json with default param', () => {
      expect(() => addDevDependency('', '')).toThrowError('Failed read `package.json`')
    })
  })

  describe('removeDevDependency', () => {
    it('should failed read package.json', () => {
      expect(() => removeDevDependency('', '')).toThrowError('Failed read `package.json`')
    })

    it('should success read dev dependency', () => {
      mockFs.setMockJson({
        [path.resolve('', PACKAGE_JSON_PATH)]: {
          name: 'name',
        }
      })
      expect(() => removeDevDependency('', '')).not.toThrow()
    })
  })
})
