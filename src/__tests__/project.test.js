const path = require('path')

jest.resetAllMocks()
jest.mock('fs-extra')
jest.mock('../core')

const mockCore = require.requireMock('../core')

const { saveConfiguration, readConfiguration } = require.requireActual('../project')

describe('project configuration', () => {
  afterAll(() => {
    mockCore.setMockModules({})
  })

  const configuration = {
    plugins: [],
    pluginsPath: '/path/packages',
  }

  it('should success save project configuration', () => {
    expect(saveConfiguration(configuration, '/path')).toBeFalsy()
  })

  it('should success read project configuration', () => {
    const configPath = path.resolve('/path/.rispa.json')
    mockCore.setMockModules({
      [configPath]: configuration,
    })
    expect(readConfiguration('/path')).toEqual(configuration)
  })
})
