jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')
jest.mock('../../utils/githubApi')
jest.mock('../../utils/git')

const path = require.requireActual('path')
const {
  CONFIGURATION_PATH,
  DEV_MODE,
  PACKAGE_JSON_PATH,
  DEFAULT_PLUGIN_DEV_BRANCH,
  DEFAULT_PLUGIN_BRANCH,
  PLUGIN_PREFIX,
} = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockGithubApi = require.requireMock('../../utils/githubApi')
const mockGit = require.requireMock('../../utils/git')

const ReleaseCommand = require.requireActual('../release')

describe('add plugins', () => {
  let originalConsoleLog

  beforeAll(() => {
    originalConsoleLog = console.log
    Object.defineProperty(console, 'log', {
      value: jest.fn(),
    })

    mockGit.getChanges.mockImplementation(() => false)
  })

  afterAll(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockCrossSpawn.setMockReject(false)
    mockInquirer.setMockAnswers({})
    mockGithubApi.setMockPlugins([])
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
    mockFs.writeFileSync.mockClear()
    mockGit.getChanges.mockClear()
    mockGit.commit.mockClear()
    mockGit.checkout.mockClear()
    mockGit.addSubtree.mockClear()
    mockGit.cloneRepository.mockClear()
    mockGit.pullRepository.mockClear()
    mockGit.addTag.mockClear()
    mockGit.push.mockClear()
    mockGit.merge.mockClear()
  })

  const cwd = '/cwd'
  const pluginsPath = path.resolve(cwd, './packages')
  const pluginName = 'rispa-core'
  const pluginPackageName = pluginName.replace('rispa-', PLUGIN_PREFIX)
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const pluginPath = path.resolve(pluginsPath, `./${pluginName}`)
  const pluginPackageJsonPath = path.resolve(pluginPath, PACKAGE_JSON_PATH)
  const pluginVersion = '1.0.0'
  const nextVersion = '1.0.1'

  const runCommand = options => {
    const command = new ReleaseCommand([], { renderer: 'silent' })
    command.init()
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)

  it('should success run', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
      [pluginPackageJsonPath]: {
        name: pluginPackageName,
        version: pluginVersion,
        dependencies: {
          [pluginPackageName]: '0.0.1',
        },
        devDependencies: {
          'rispa-test': '0.0.1',
        },
        peerDependencies: {
          'rispa-test': '0.0.1',
          'other-package': '0.0.1',
        },
      },
    })

    mockInquirer.setMockAnswers({ nextVersion })

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockGit.checkout.mock.calls[0]).toEqual([pluginPath, DEFAULT_PLUGIN_DEV_BRANCH])
    expect(mockGit.pullRepository.mock.calls[0]).toEqual([pluginPath])
    expect(mockFs.writeFileSync.mock.calls[0][0]).toEqual(pluginPackageJsonPath)
    expect(mockGit.commit.mock.calls[0]).toEqual([pluginPath, `Version ${nextVersion}`])
    expect(mockGit.addTag.mock.calls[0]).toEqual([pluginPath, `v${nextVersion}`])
    expect(mockGit.push.mock.calls[0]).toEqual([pluginPath])
    expect(mockGit.checkout.mock.calls[1]).toEqual([pluginPath, DEFAULT_PLUGIN_BRANCH])
    expect(mockGit.merge.mock.calls[0]).toEqual([pluginPath, DEFAULT_PLUGIN_DEV_BRANCH])
    expect(mockGit.push.mock.calls[1]).toEqual([pluginPath])
    expect(mockGit.checkout.mock.calls[2]).toEqual([pluginPath, DEFAULT_PLUGIN_DEV_BRANCH])
  })

  it('should success run with different versions', async () => {
    const pluginName2 = 'rispa-plugin'
    const plugin2Version = '2.0.0'
    const plugin2Path = path.resolve(pluginsPath, `./${pluginName2}`)
    const plugin2PackageJsonPath = path.resolve(plugin2Path, PACKAGE_JSON_PATH)

    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [pluginName, pluginName2],
        remotes: {
          [pluginName]: pluginRemoteUrl,
          [plugin2Version]: false,
        },
      },
      [pluginPackageJsonPath]: {
        name: pluginName,
        version: pluginVersion,
        dependencies: {
          [pluginName2]: plugin2Version,
        },
      },
      [plugin2PackageJsonPath]: {
        name: pluginName2,
        version: plugin2Version,
      },
    })

    mockInquirer.setMockAnswers({ nextVersion })

    await expect(runCommand().catch(e => console.error(e))).resolves.toBeDefined()

    expect(mockGit.checkout.mock.calls[0]).toEqual([pluginPath, DEFAULT_PLUGIN_DEV_BRANCH])
    expect(mockGit.pullRepository.mock.calls[0]).toEqual([pluginPath])

    expect(mockGit.checkout.mock.calls[1]).toEqual([plugin2Path, DEFAULT_PLUGIN_DEV_BRANCH])
    expect(mockGit.pullRepository.mock.calls[1]).toEqual([plugin2Path])

    expect(mockFs.writeFileSync.mock.calls[0][0]).toEqual(pluginPackageJsonPath)
    expect(mockGit.commit.mock.calls[0]).toEqual([pluginPath, `Version ${nextVersion}`])
    expect(mockGit.addTag.mock.calls[0]).toEqual([pluginPath, `v${nextVersion}`])
    expect(mockGit.push.mock.calls[0]).toEqual([pluginPath])
    expect(mockGit.checkout.mock.calls[2]).toEqual([pluginPath, DEFAULT_PLUGIN_BRANCH])
    expect(mockGit.merge.mock.calls[0]).toEqual([pluginPath, DEFAULT_PLUGIN_DEV_BRANCH])
    expect(mockGit.push.mock.calls[1]).toEqual([pluginPath])
    expect(mockGit.checkout.mock.calls[3]).toEqual([pluginPath, DEFAULT_PLUGIN_DEV_BRANCH])

    expect(mockFs.writeFileSync.mock.calls[1][0]).toEqual(plugin2PackageJsonPath)
    expect(mockGit.commit.mock.calls[1]).toEqual([plugin2Path, `Version ${nextVersion}`])
    expect(mockGit.addTag.mock.calls[1]).toEqual([plugin2Path, `v${nextVersion}`])
    expect(mockGit.push.mock.calls[2]).toEqual([plugin2Path])
    expect(mockGit.checkout.mock.calls[4]).toEqual([plugin2Path, DEFAULT_PLUGIN_BRANCH])
    expect(mockGit.merge.mock.calls[1]).toEqual([plugin2Path, DEFAULT_PLUGIN_DEV_BRANCH])
    expect(mockGit.push.mock.calls[3]).toEqual([plugin2Path])
    expect(mockGit.checkout.mock.calls[5]).toEqual([plugin2Path, DEFAULT_PLUGIN_DEV_BRANCH])
  })

  it('should failed run in non dev mode', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    await expect(runCommand()).rejects.toHaveProperty('message', 'Release available only in development mode')
  })

  it('should interrupt run after prompt', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
      [pluginPackageJsonPath]: {
        name: pluginName,
        version: pluginVersion,
        dependencies: {
          [`${PLUGIN_PREFIX}plugins`]: '1.0.0',
        },
      },
    })

    await expect(runCommand()).rejects.toHaveProperty('message', 'Interrupt command')
  })
})
