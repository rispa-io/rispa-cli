jest.mock('inquirer')
jest.mock('fs-extra')
jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/saveProjectConfiguration')
jest.mock('../../utils/git')

const path = require.requireActual('path')
const { ALL_PLUGINS, DEV_MODE, TEST_MODE } = require.requireActual('../../constants')

const readProjectConfiguration = require.requireMock('../../tasks/readProjectConfiguration')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockGit = require.requireMock('../../utils/git')

const UpdatePluginsCommand = require.requireActual('../updatePlugins')

describe('update plugins', () => {
  beforeEach(() => {
    mockGit.getChanges.mockClear()
    mockGit.getChanges.mockReset()
    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => true)
    mockGit.updateSubtree.mockClear()
    mockGit.updateSubtree.mockImplementation(() => true)
    mockGit.commit.mockClear()
    mockGit.clean.mockClear()
    mockGit.pullRepository.mockClear()
  })

  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const pluginsPath = './packages'
  const pluginPath = path.resolve(cwd, pluginsPath, `./${pluginName}`)

  const runCommand = params => {
    const command = new UpdatePluginsCommand(params, { renderer: 'silent' })
    command.init()
    return command.run({
      cwd,
      projectPath: cwd,
    })
  }

  const mockReadConfigurationTask = mode => {
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.configuration = {
        mode,
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      }
    })
  }

  it('should success update single plugin', async () => {
    mockReadConfigurationTask()

    await expect(runCommand([pluginName])).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalledWith(cwd)
    expect(mockGit.updateSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl)
    expect(mockGit.commit).toBeCalledWith(cwd, `Update plugins: ${pluginName}`)
  })

  it('should success update single plugin with skip commit', async () => {
    mockReadConfigurationTask()

    mockGit.getChanges.mockReset()
    mockGit.getChanges.mockImplementationOnce(() => false)

    await expect(runCommand([pluginName])).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalledWith(cwd)
    expect(mockGit.updateSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl)
    expect(mockGit.commit).not.toBeCalled()
  })

  it('should success run update with empty plugins list', async () => {
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.configuration = {
        pluginsPath,
        plugins: [],
        remotes: {},
      }
    })

    await expect(runCommand([ALL_PLUGINS])).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalledWith(cwd)
    expect(mockGit.updateSubtree).not.toBeCalled()
    expect(mockGit.commit).not.toBeCalled()
  })

  it('should failed update single plugin in dev mode', async () => {
    mockReadConfigurationTask(DEV_MODE)

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('message', 'Not a git repository: .git')
  })

  it('should success update single plugin in dev mode', async () => {
    mockReadConfigurationTask(DEV_MODE)

    mockFs.setMockFiles([path.resolve(pluginPath, './.git')])

    await expect(runCommand([pluginName])).resolves.toBeDefined()
    expect(mockGit.pullRepository).toBeCalledWith(pluginPath)
  })

  it('should success update single plugin in test mode', async () => {
    mockReadConfigurationTask(TEST_MODE)

    mockFs.setMockFiles([path.resolve(pluginPath, './.git')])

    await expect(runCommand([pluginName])).resolves.toBeDefined()
    expect(mockGit.clean).toBeCalledWith(pluginPath)
    expect(mockGit.pullRepository).toBeCalledWith(pluginPath)
  })

  it('should success update all plugins', async () => {
    const pluginName2 = 'rispa-config'
    const pluginRemoteUrl2 = `https://git.com/${pluginName2}.git`
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.configuration = {
        pluginsPath,
        plugins: [pluginName, pluginName2],
        remotes: {
          [pluginName]: pluginRemoteUrl,
          [pluginName2]: pluginRemoteUrl2,
        },
      }
    })

    await expect(runCommand([ALL_PLUGINS])).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalledWith(cwd)
    expect(mockGit.updateSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl)
    expect(mockGit.updateSubtree).toBeCalledWith(cwd, `packages/${pluginName2}`, pluginName2, pluginRemoteUrl2)
    expect(mockGit.commit).toBeCalledWith(cwd, `Update plugins: ${pluginName}, ${pluginName2}`)
  })

  it('should success update selected plugins', async () => {
    mockReadConfigurationTask()

    mockInquirer.setMockAnswers({
      selectedPlugins: [pluginName],
    })

    await expect(runCommand([])).resolves.toBeDefined()

    expect(mockGit.updateSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl)
    expect(mockGit.commit).toBeCalledWith(cwd, `Update plugins: ${pluginName}`)
  })

  it('should failed update plugins - cant find plugin', async () => {
    mockReadConfigurationTask()

    await expect(runCommand(['somePlugin']))
      .rejects.toHaveProperty('message', 'Can\'t find plugins with names:\n - somePlugin')
  })

  it('should failed update plugins - tree has modifications', async () => {
    mockReadConfigurationTask()

    mockGit.getChanges.mockReset()
    mockGit.getChanges.mockImplementation(() => true)

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('message', 'Working tree has modifications. Cannot update plugins')
  })

  it('should failed update plugin - failed update subtree', async () => {
    mockReadConfigurationTask()

    mockGit.updateSubtree.mockImplementation(() => false)

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('message', `Failed update subtree '${pluginRemoteUrl}'`)
  })
})
