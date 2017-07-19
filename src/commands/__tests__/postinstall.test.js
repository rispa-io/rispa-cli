jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/scanPlugins')
jest.mock('cross-spawn')

const readProjectConfiguration = require.requireMock('../../tasks/readProjectConfiguration')
const scanPlugins = require.requireMock('../../tasks/scanPlugins')
const mockCrossSpawn = require.requireMock('cross-spawn')

const PostinstallCommand = require.requireActual('../postinstall')

describe('postinstall', () => {
  const cwd = '/cwd'

  const runCommand = options => {
    const command = new PostinstallCommand({ renderer: 'silent' })
    command.init()
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  it('should run rispa-postinstall script commands', async () => {
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.projectPath = cwd
      ctx.configuration = {}
    })

    scanPlugins.setMockPlugins({
      plugin1: {
        postinstall: 'command1 param1 param2 && command2 param3',
      },
      plugin2: {},
      plugin3: {
        postinstall: 'command3 param4 && command4 param5 param6',
      },
    })

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'command1',
      ['param1', 'param2'],
      { cwd, stdio: 'inherit' }
    )
    expect(mockCrossSpawn.sync).toBeCalledWith(
      'command2',
      ['param3'],
      { cwd, stdio: 'inherit' }
    )
    expect(mockCrossSpawn.sync).toBeCalledWith(
      'command3',
      ['param4'],
      { cwd, stdio: 'inherit' }
    )
    expect(mockCrossSpawn.sync).toBeCalledWith(
      'command4',
      ['param5', 'param6'],
      { cwd, stdio: 'inherit' }
    )
  })
})
