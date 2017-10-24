jest.mock('fs-extra')
jest.mock('../../utils/git')

const mockFs = require.requireMock('fs-extra')
const mockGit = require.requireMock('../../utils/git')

const path = require.requireActual('path')
const { PACKAGE_JSON_PATH } = require.requireActual('../../constants')

const createRestorePluginTask = require.requireActual('../restorePlugin')

describe('createRestorePluginTask', () => {
  const projectPath = '/projectPath'
  const pluginsPath = path.resolve(projectPath, './plugins')
  const plugin = {
    name: 'rispa-core',
    remote: 'https://remote'
  }
  const genContext = mode => ({
    projectPath,
    configuration: {
      mode,
      pluginsPath: './plugins',
      plugins: [
        plugin,
      ],
    },
  })

  beforeEach(() => {
    mockGit.getRemotes.mockClear()
    mockGit.addSubtree.mockClear()
    mockGit.cloneRepository.mockClear()
  })

  it('should create task', () => {
    const task = createRestorePluginTask({ name: 'pluginName' })
    expect(task).toHaveProperty('title')
  })

  describe('task', () => {
    it('should add plugin', () => {
      mockGit.getRemotes.mockImplementationOnce(() => ({}))

      const ctx = genContext()
      createRestorePluginTask(plugin).task(ctx)

      expect(mockGit.addSubtree).toBeCalledWith(
        projectPath,
        'plugins/rispa-core',
        'rispa-core',
        'https://remote'
      )
    })

    it('should not add plugin if exists', () => {
      mockGit.getRemotes.mockImplementationOnce(() => ({
        'rispa-core': {},
      }))

      const ctx = genContext()
      createRestorePluginTask(plugin).task(ctx)

      expect(mockGit.addSubtree).not.toBeCalled()
      expect(mockGit.cloneRepository).not.toBeCalled()
    })

    it('should add plugin in dev mode', () => {
      mockGit.getRemotes.mockImplementationOnce(() => ({}))

      const ctx = genContext('dev')
      createRestorePluginTask(plugin).task(ctx)

      expect(mockGit.cloneRepository).toBeCalledWith(
        pluginsPath,
        'https://remote'
      )
    })

    it('should not add plugin if exists in dev mode', () => {
      mockFs.setMockFiles([path.resolve(pluginsPath, 'rispa-core', PACKAGE_JSON_PATH)])

      const ctx = genContext('dev')
      createRestorePluginTask(plugin).task(ctx)

      expect(mockGit.addSubtree).not.toBeCalled()
      expect(mockGit.cloneRepository).not.toBeCalled()

      mockFs.setMockFiles()
    })
  })
})
