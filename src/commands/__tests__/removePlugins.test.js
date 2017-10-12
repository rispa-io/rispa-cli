jest.mock('fs-extra')
jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/saveProjectConfiguration')
jest.mock('../../tasks/selectPlugins')
jest.mock('../../tasks/cleanCache')
jest.mock('../../utils/git')

const path = require.requireActual('path')
const { DEV_MODE } = require.requireActual('../../constants')

const mockFs = require.requireMock('fs-extra')
const readProjectConfiguration = require.requireMock('../../tasks/readProjectConfiguration')
const saveProjectConfiguration = require.requireMock('../../tasks/saveProjectConfiguration')
const selectPlugins = require.requireMock('../../tasks/selectPlugins')
const cleanCache = require.requireMock('../../tasks/cleanCache')
const mockGit = require.requireMock('../../utils/git')

const RemovePluginsCommand = require.requireActual('../removePlugins')

describe('remove plugins', () => {
  beforeEach(() => {
    mockGit.removeRemote.mockClear()
    mockGit.commit.mockClear()
    saveProjectConfiguration.task.mockClear()
    selectPlugins.task.mockClear()
    cleanCache.task.mockClear()
    mockGit.getChanges.mockClear()
    mockGit.getChanges.mockReset()
    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => true)
  })

  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const pluginsPath = './packages'
  const plugin = {
    name: pluginName,
    remote: pluginRemoteUrl,
  }

  const runCommand = params => {
    const command = new RemovePluginsCommand(params, { renderer: 'silent' })
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
        plugins: [plugin],
      }
    })
  }

  it('should success remove plugin', async () => {
    mockReadConfigurationTask()
    mockGit.getChanges.mockImplementation(() => false)

    await expect(runCommand([pluginName])).resolves.toBeDefined()

    expect(saveProjectConfiguration.task).toBeCalled()
    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.removeRemote).toBeCalledWith(cwd, pluginName)
    expect(mockGit.commit).toBeCalledWith(cwd, `Remove plugins: ${pluginName}`)
    expect(cleanCache.task).toBeCalled()
  })

  it('should success remove plugin with skip commit', async () => {
    mockReadConfigurationTask()

    mockGit.getChanges.mockReset()
    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => false)

    await expect(runCommand([pluginName])).resolves.toBeDefined()

    expect(saveProjectConfiguration.task).toBeCalled()
    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.removeRemote).toBeCalledWith(cwd, pluginName)
    expect(mockGit.commit).not.toBeCalled()
    expect(cleanCache.task).toBeCalled()
  })


  it('should success remove plugin in dev mode', async () => {
    mockReadConfigurationTask(DEV_MODE)

    await expect(runCommand([pluginName])).resolves.toBeDefined()

    expect(mockGit.getChanges).not.toBeCalled()
    expect(mockGit.removeRemote).not.toBeCalled()
    expect(mockGit.commit).not.toBeCalled()
    expect(saveProjectConfiguration.task).toBeCalled()
    expect(cleanCache.task).toBeCalled()
  })

  it('should success remove plugin selected from list', async () => {
    mockReadConfigurationTask()

    selectPlugins.task.mockImplementation(ctx => {
      ctx.selectedPlugins = [pluginName]
    })

    await expect(runCommand([])).resolves.toBeDefined()

    expect(mockGit.removeRemote).toBeCalledWith(cwd, pluginName)
    expect(mockGit.commit).toBeCalledWith(cwd, `Remove plugins: ${pluginName}`)
  })

  it('should success remove multiple plugins', async () => {
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.configuration = {
        pluginsPath,
        plugins: [
          plugin,
          {
            name: 'rispa-config',
            remote: 'remote2',
          }
        ],
      }
    })

    await expect(runCommand(['rispa-core', 'rispa-config'])).resolves.toBeDefined()

    expect(mockGit.removeRemote).toBeCalledWith(cwd, 'rispa-core')
    expect(mockGit.removeRemote).toBeCalledWith(cwd, 'rispa-config')
    expect(mockGit.commit).toBeCalledWith(cwd, 'Remove plugins: rispa-core, rispa-config')
  })

  it('should success remove plugin with skip one', async () => {
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.configuration = {
        pluginsPath,
        plugins: [plugin],
      }
    })

    await expect(runCommand(['rispa-core', 'rispa-config']))
      .rejects.toHaveProperty('message', 'Can\'t find plugins with names:\n - rispa-config')
  })

  it('should failed remove plugin - tree has modifications', async () => {
    mockReadConfigurationTask()
    mockGit.getChanges.mockReset()
    mockGit.getChanges.mockImplementationOnce(() => 'M test.js')

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('message', 'Working tree has modifications. Cannot remove plugins')
  })

  it('should failed remove plugin - error during remove', async () => {
    mockReadConfigurationTask()

    const errorMessage = 'errorMessage'
    mockFs.setMockRemoveCallback({
      [path.resolve(cwd, pluginsPath, `./${pluginName}`)]: () => {
        throw new Error(errorMessage)
      },
    })

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('errors.0.message', errorMessage)

    mockFs.setMockRemoveCallback()
  })
})
