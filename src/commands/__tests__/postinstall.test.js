jest.mock('cross-spawn')
jest.mock('fs-extra')

const path = require.requireActual('path')
const {
  PACKAGE_JSON_PATH,
  LERNA_JSON_PATH,
} = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockFs = require.requireMock('fs-extra')

const PostinstallCommand = require.requireActual('../postinstall')

describe('postinstall', () => {
  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
  })

  const cwd = '/project/packages/plugin'
  const lernaJsonPath = path.resolve('/project', LERNA_JSON_PATH)
  const pluginPackageJsonPath = path.resolve(cwd, PACKAGE_JSON_PATH)
  const postinstallScript = 'command1 param1 param2 && command2 param3'

  const runCommand = options => {
    const command = new PostinstallCommand({ renderer: 'silent' })
    command.init()
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  it('should report error `rispa-postinstall script not found`', async () => {
    mockFs.setMockJson({
      [pluginPackageJsonPath]: {
        scripts: {},
      },
    })

    await expect(runCommand())
      .rejects
      .toHaveProperty('message', 'Can\'t find rispa-postinstall script')
  })

  it('should report error `project root not found`', async () => {
    mockFs.setMockJson({
      [pluginPackageJsonPath]: {
        scripts: {
          'rispa-postinstall': postinstallScript,
        },
      },
    })

    await expect(runCommand())
      .rejects
      .toHaveProperty('message', 'Can\'t find rispa project root')
  })


  it('should run rispa-postinstall script commands', async () => {
    mockFs.setMockFiles([
      lernaJsonPath,
    ])
    mockFs.setMockJson({
      [pluginPackageJsonPath]: {
        scripts: {
          'rispa-postinstall': postinstallScript,
        },
      },
    })

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'command1',
      ['param1', 'param2'],
      { cwd: '/project', stdio: 'inherit' }
    )
    expect(mockCrossSpawn.sync).toBeCalledWith(
      'command2',
      ['param3'],
      { cwd: '/project', stdio: 'inherit' }
    )
  })
})
