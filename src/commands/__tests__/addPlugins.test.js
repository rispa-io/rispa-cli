jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')
jest.mock('../../utils/githubApi')
jest.mock('../../utils/git')
jest.mock('../../tasks/scanPlugins')

const path = require.requireActual('path')
const chalk = require.requireActual('chalk')
const {
  CONFIGURATION_PATH,
  PLUGIN_GIT_PREFIX,
  DEV_MODE,
  TEST_MODE,
  PLUGIN_PREFIX,
  PACKAGE_JSON_PATH,
  DEFAULT_PLUGIN_BRANCH,
} = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockGithubApi = require.requireMock('../../utils/githubApi')
const mockGit = require.requireMock('../../utils/git')
const scanPlugins = require.requireMock('../../tasks/scanPlugins')

const AddPluginsCommand = require.requireActual('../addPlugins')

describe('add plugins', () => {
  beforeAll(() => {
    mockGit.getChanges.mockImplementation(() => false)

    scanPlugins.setMockPlugins([])
  })

  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockCrossSpawn.setMockReject(false)
    mockInquirer.setMockAnswers({})
    mockGithubApi.setMockPlugins([])
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
    mockGit.getChanges.mockClear()
    mockGit.getChanges.mockReset()
    mockGit.commit.mockClear()
    mockGit.addSubtree.mockClear()
    mockGit.cloneRepository.mockClear()
  })

  const cwd = '/cwd'
  const pluginsPath = path.resolve(cwd, './packages')
  const pluginName = 'rispa-core'
  const pluginPackageName = pluginName.replace('rispa-', PLUGIN_PREFIX)
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const pluginPath = path.resolve(pluginsPath, `./${pluginName}`)
  const pluginPackageJsonPath = path.resolve(pluginPath, PACKAGE_JSON_PATH)
  const resolvePluginName = 'rispa-config'
  const resolvePluginPackageName = resolvePluginName.replace('rispa-', PLUGIN_PREFIX)
  const resolvePluginVersion = '1.2.3'
  const resolvePluginRemoteUrl = `https://git.com/${resolvePluginName}.git`

  const runCommand = (plugins = [], options) => {
    const command = new AddPluginsCommand(plugins, { renderer: 'silent' })
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)
  const crossSpawnOptions = { cwd, stdio: 'inherit' }

  it('should success add plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
      },
      [pluginPackageJsonPath]: {
        dependencies: {
          [resolvePluginPackageName]: resolvePluginVersion,
        },
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }, {
      name: resolvePluginName,
      clone_url: resolvePluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginsExtendable([resolvePluginName])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginPackageName,
      },
      [resolvePluginName]: {
        name: resolvePluginPackageName,
      },
    })

    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => true)

    await expect(
      runCommand([pluginName], { projectPath: cwd })
    ).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.addSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl, DEFAULT_PLUGIN_BRANCH)
    expect(mockGit.addSubtree).toBeCalledWith(cwd, `packages/${resolvePluginName}`, resolvePluginName, resolvePluginRemoteUrl, `v${resolvePluginVersion}`)
    expect(mockGit.commit).toBeCalledWith(cwd, `Add plugins: ${pluginName}, ${resolvePluginName}`)
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should success add select plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
      },
      [pluginPackageJsonPath]: {
        dependencies: {
          [resolvePluginPackageName]: resolvePluginVersion,
        },
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }, {
      name: resolvePluginName,
      clone_url: resolvePluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginsExtendable([resolvePluginName])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginPackageName,
      },
    })

    mockInquirer.setMockAnswers({
      selectedPlugins: [{
        name: pluginName,
        remote: pluginRemoteUrl,
        ref: DEFAULT_PLUGIN_BRANCH
      }],
    })

    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => true)

    await expect(
      runCommand([], { projectPath: cwd })
    ).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.addSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl, DEFAULT_PLUGIN_BRANCH)
    expect(mockGit.commit).toBeCalledWith(cwd, `Add plugins: ${pluginName}`)
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should success add plugin in dev mode', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [],
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    await expect(
      runCommand([pluginName])
    ).resolves.toBeDefined()

    expect(mockGit.cloneRepository).toBeCalledWith(pluginsPath, pluginRemoteUrl)
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should success add plugin in test mode', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: TEST_MODE,
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    await expect(
      runCommand([pluginName])
    ).resolves.toBeDefined()

    expect(mockGit.cloneRepository).toBeCalledWith(pluginsPath, pluginRemoteUrl, { depth: 1 })
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should success add plugin and bootstrap via yarn', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => true)

    await expect(
      runCommand([pluginName], { yarn: true })
    ).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.addSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl, DEFAULT_PLUGIN_BRANCH)
    expect(mockGit.commit).toBeCalledWith(cwd, `Add plugins: ${pluginName}`)
    expect(mockCrossSpawn.sync).toBeCalledWith('yarn', ['bs'], crossSpawnOptions)
  })

  it('should success add plugin with skip commit', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
      },
    })

    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => false)

    await expect(
      runCommand([`${PLUGIN_GIT_PREFIX}${pluginRemoteUrl}`])
    ).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.addSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl, undefined)
    expect(mockGit.commit).not.toBeCalledWith()
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should success add plugin via git url', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
      },
    })

    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => true)

    await expect(
      runCommand([`${PLUGIN_GIT_PREFIX}${pluginRemoteUrl}`])
    ).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.addSubtree).toBeCalledWith(cwd, `packages/${pluginName}`, pluginName, pluginRemoteUrl, undefined)
    expect(mockGit.commit).toBeCalledWith(cwd, `Add plugins: ${pluginName}`)
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should skip add plugin - already exist', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [{
          name: pluginName,
          remote: pluginRemoteUrl,
        }],
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    mockGit.getChanges.mockImplementationOnce(() => false)
    mockGit.getChanges.mockImplementationOnce(() => true)

    await expect(
      runCommand([pluginName])
    ).resolves.toBeDefined()

    expect(mockGit.getChanges).toBeCalled()
    expect(mockGit.addSubtree).not.toBeCalledWith()
    expect(mockGit.commit).not.toBeCalledWith()
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should failed add plugin - cant find', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
      },
    })

    mockGithubApi.setMockPlugins([])

    await expect(
      runCommand(['rispa-config'])
    ).rejects.toHaveProperty('message', 'Can\'t find plugins with names:\n - rispa-config')
  })

  it('should failed add plugin - tree has modifications', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
      },
    })

    mockGithubApi.setMockPlugins([])

    mockGit.getChanges.mockImplementationOnce(() => true)

    await expect(
      runCommand([pluginName])
    ).rejects.toHaveProperty('message', 'Working tree has modifications. Cannot add plugins')
  })

  it('should failed add plugin - cant find plugins for select', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [{
          name: pluginName,
          remote: pluginRemoteUrl,
        }],
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    await expect(
      runCommand([])
    ).rejects.toHaveProperty('message', 'Can\'t find plugins for select')
  })

  it('should failed add plugin - invalid git url', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
      },
    })

    const invalidRemoteUrl = '/invalid-url'

    await expect(
      runCommand([`${PLUGIN_GIT_PREFIX}${invalidRemoteUrl}`])
    ).rejects.toHaveProperty('errors.0.message', `Invalid plugin remote url ${chalk.cyan(invalidRemoteUrl)}`)

    expect(mockGit.addSubtree).not.toBeCalledWith()
    expect(mockGit.commit).not.toBeCalledWith()
    expect(mockCrossSpawn.sync).toBeCalledWith('npm', ['run', 'bs'], crossSpawnOptions)
  })

  it('should failed add plugin - configuration not found', async () => {
    mockFs.setMockJson({})

    await expect(
      runCommand([])
    ).rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })
})
