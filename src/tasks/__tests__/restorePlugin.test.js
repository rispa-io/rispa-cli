const path = require('path')

jest.mock('fs-extra')
jest.mock('../../utils/git')

const mockFs = require.requireMock('fs-extra')
const mockGit = require.requireMock('../../utils/git')

const createRestorePluginTask = require.requireActual('../restorePlugin')

describe('createRestorePluginTask', () => {
  const projectPath = '/projectPath'
  const pluginsPath = path.resolve(projectPath, './plugins')
  const genContext = mode => ({
    projectPath,
    configuration: {
      mode,
      pluginsPath: './plugins',
      plugins: [
        'rispa-core',
      ],
      remotes: {
        'rispa-core': 'https://remote',
      },
    },
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  it('should create task', () => {
    const task = createRestorePluginTask('pluginName')
    expect(task).toHaveProperty('title')
  })

  describe('task', () => {
    it('should add plugin', () => {
      mockGit.getRemotes.mockImplementationOnce(() => ({}))

      const ctx = genContext()
      createRestorePluginTask('rispa-core').task(ctx)

      expect(mockGit.addSubtree).toBeCalledWith(
        projectPath,
        'plugins/rispa-core',
        'rispa-core',
        'https://remote',
      )
    })

    it('should not add plugin if exists', () => {
      mockGit.getRemotes.mockImplementationOnce(() => ({
        'rispa-core': {},
      }))

      const ctx = genContext()
      createRestorePluginTask('rispa-core').task(ctx)

      expect(mockGit.addSubtree.mock.calls.length).toBe(0)
      expect(mockGit.cloneRepository.mock.calls.length).toBe(0)
    })

    it('should add plugin in dev mode', () => {
      mockGit.getRemotes.mockImplementationOnce(() => ({}))

      const ctx = genContext('dev')
      createRestorePluginTask('rispa-core').task(ctx)

      expect(mockGit.cloneRepository).toBeCalledWith(
        pluginsPath,
        'https://remote',
      )
    })

    it('should not add plugin if exists in dev mode', () => {
      mockFs.setMockFiles([path.resolve(pluginsPath, 'rispa-core')])

      const ctx = genContext('dev')
      createRestorePluginTask('rispa-core').task(ctx)

      expect(mockGit.addSubtree.mock.calls.length).toBe(0)
      expect(mockGit.cloneRepository.mock.calls.length).toBe(0)
    })
  })
})
