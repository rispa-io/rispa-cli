jest.mock('fs-extra')
jest.mock('cross-spawn')

const mockCrossSpawn = require.requireMock('cross-spawn')

const createRunTask = require.requireActual('../runPluginScript')

describe('createRunPluginScriptTask', () => {
  const pluginName = 'plugin'
  const scriptName = 'script'
  const pluginPath = '/path'
  const args = [1, 2]

  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
  })

  it('should create task with title', () => {
    const task = createRunTask(pluginName, pluginPath, scriptName)

    expect(task.title).toContain(pluginName)
    expect(task.title).toContain(scriptName)
    expect(task).toHaveProperty('task')
  })

  it('should run task with npm', () => {
    createRunTask(pluginName, pluginPath, scriptName, args).task({})

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'npm', ['run', scriptName, ...args],
      { cwd: pluginPath, stdio: 'inherit' }
    )
  })

  it('should run task with yarn', () => {
    createRunTask(pluginName, pluginPath, scriptName, args).task({ yarn: true })

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'yarn', [scriptName, ...args],
      { cwd: pluginPath, stdio: 'inherit' }
    )
  })

  it('should throw error', () => {
    mockCrossSpawn.setMockReject(true)

    const task = createRunTask(pluginName, pluginPath, scriptName, args)

    expect(() => task.task({})).toThrow('Failed run plugin script')

    mockCrossSpawn.setMockReject(false)
  })
})
