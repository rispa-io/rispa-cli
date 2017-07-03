jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/cleanCache')

const readProjectConfigurationTask = require.requireMock('../../tasks/readProjectConfiguration')
const cleanCache = require.requireMock('../../tasks/cleanCache')

const CleanCacheCommand = require.requireActual('../cleanCache')

describe('assemble command', () => {
  const projectPath = '/path'

  it('should init successfully', () => {
    const command = new CleanCacheCommand()
    command.init()
    expect(command.tasks.length).toBe(2)
  })

  it('should run tasks successfully', async () => {
    readProjectConfigurationTask.task.mockClear()
    readProjectConfigurationTask.task.mockImplementation(ctx => {
      ctx.projectPath = projectPath
    })

    const command = new CleanCacheCommand({
      renderer: 'silent',
    })
    command.init()
    const result = await command.run({
      cwd: '/cwd',
    })

    expect(result).toBeDefined()
    expect(readProjectConfigurationTask.task).toBeCalled()
    expect(cleanCache.task).toBeCalled()
  })
})
