jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/saveProjectConfiguration')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { CONFIGURATION_PATH, CONFIGURATION_VERSION } = require.requireActual('../../constants')

const readProjectConfigurationTask = require.requireMock('../../tasks/readProjectConfiguration')
const saveProjectConfigurationTask = require.requireMock('../../tasks/saveProjectConfiguration')

const MigrateCommand = require.requireActual('../migrate')

describe('migration command', () => {
  const cwd = '/cwd'
  const pluginName = 'pluginName'

  const runCommand = (params, options) => {
    const command = new MigrateCommand(params, { renderer: 'silent' })
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  it('should not run migration', async () => {
    readProjectConfigurationTask.task.mockClear()
    saveProjectConfigurationTask.task.mockClear()
    readProjectConfigurationTask.task.mockImplementation(ctx => {
      ctx.configuration = {
        version: CONFIGURATION_VERSION,
        pluginsPath: '',
        plugins: [{
          name: pluginName,
        }],
      }
    })
    saveProjectConfigurationTask.task.mockImplementation(() => {})

    await expect(runCommand([])).resolves.toBeDefined()

    expect(saveProjectConfigurationTask.task).toBeCalled()
  })

  it('should run migration', async () => {
    readProjectConfigurationTask.task.mockClear()
    saveProjectConfigurationTask.task.mockClear()
    readProjectConfigurationTask.task.mockImplementation(ctx => {
      ctx.configuration = {
        pluginsPath: '',
        plugins: [
          pluginName,
        ],
        remotes: {
          [pluginName]: 'url'
        },
      }
    })
    saveProjectConfigurationTask.task.mockImplementation(() => {})

    await expect(runCommand([])).resolves.toBeDefined()

    expect(saveProjectConfigurationTask.task).toBeCalled()
  })

  it('should run migration if version below ', async () => {
    readProjectConfigurationTask.task.mockClear()
    saveProjectConfigurationTask.task.mockClear()
    readProjectConfigurationTask.task.mockImplementation(ctx => {
      ctx.configuration = {
        version: 0,
        pluginsPath: '',
        plugins: [
          pluginName,
        ],
      }
    })
    saveProjectConfigurationTask.task.mockImplementation(() => {})

    await expect(runCommand([])).resolves.toBeDefined()

    expect(saveProjectConfigurationTask.task).toBeCalled()
  })
})
