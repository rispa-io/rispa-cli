jest.resetAllMocks()
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../../core')

const mockFs = require.requireMock('fs-extra')
const mockCore = require.requireMock('../../core')

const removePlugins = require.requireActual('../removePlugins')

describe('remove plugins', () => {
  let originalExit

  const pluginsNames = ['rispa-core', 'rispa-eslint-config']
  const pluginsPath = '/sample/path'
  const projectConfigPath = `${process.cwd()}/.rispa.json`
  const projectConfig = {
    plugins: [],
    pluginsPath,
  }

  beforeAll(() => {
    originalExit = process.exit
    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    mockFs.setMockFiles([])
    mockCore.setMockModules({})
  })

  it('should success remove plugin', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })

    await expect(removePlugins(...pluginsNames))
      .rejects.toBe(1)
  })

  it('should failed update plugins - project config not found', async () => {
    mockCore.setMockModules({})

    await expect(removePlugins())
      .rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })

  it('should failed update plugins - cant remove plugin', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })

    mockFs.setMockRemoveCallback(() => { throw new Error() })

    await expect(removePlugins(...pluginsNames))
      .rejects.toBe(1)
  })
})
