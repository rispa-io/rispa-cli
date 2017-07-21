jest.mock('cross-spawn')
jest.mock('../plugin')
jest.mock('../project')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockPlugins = require.requireMock('../plugin')
const mockProject = require.requireMock('../project')

const {
  installPresetYarn,
  installPresetNpm,
  findPresetInDependencies,
  readPresetConfiguration,
} = require.requireActual('../preset')

describe('preset utils', () => {
  const cwd = '/path/to/cwd'
  describe('installPresetYarn', () => {
    it('should success work', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 0 }))

      expect(() => installPresetYarn('name', cwd)).not.toThrow()
    })
    it('should failed', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => installPresetYarn('name', cwd)).toThrow()
    })
  })

  describe('installPresetNpm', () => {
    it('should success work', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 0 }))

      expect(() => installPresetNpm('name', cwd)).not.toThrow()
    })
    it('should failed', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => installPresetNpm('name', cwd)).toThrow()
    })
  })

  describe('findPresetInDependencies', () => {
    const preset = 'preset'
    it('should success find if name', () => {
      mockPlugins.readDependencies.mockImplementationOnce(() => ({
        [preset]: '1.2.0',
      }))

      const result = findPresetInDependencies(preset, cwd)

      expect(result).toEqual(preset)
    })

    it('should success find if version', () => {
      const url = 'https://url.com/clone.git'
      mockPlugins.readDependencies.mockImplementationOnce(() => ({
        [preset]: `git+${url}`,
      }))

      const result = findPresetInDependencies(url, cwd)

      expect(result).toEqual(preset)
    })
  })

  describe('readPresetConfiguration', () => {
    const preset = 'preset'
    it('should success work', () => {
      mockPlugins.readDependencies.mockImplementationOnce(() => ({
        [preset]: '1.2.0',
      }))

      const configuration = {}

      mockProject.readConfiguration.mockImplementationOnce(() => configuration)

      const result = readPresetConfiguration(preset, cwd)

      expect(result).toBe(configuration)
    })

    it('should failed find preset in deps', () => {
      mockPlugins.readDependencies.mockImplementationOnce(() => ({}))

      expect(() => readPresetConfiguration(preset, cwd)).toThrow()
    })
    it('should failed find configuration', () => {
      mockPlugins.readDependencies.mockImplementationOnce(() => ({
        [preset]: '1.2.0',
      }))

      mockProject.readConfiguration.mockImplementationOnce(() => false)

      expect(() => readPresetConfiguration(preset, cwd)).toThrow()
    })
  })
})
