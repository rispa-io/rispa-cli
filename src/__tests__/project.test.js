/* eslint-disable import/no-dynamic-require, global-require */

jest.resetAllMocks()
jest.mock('fs-extra')
jest.mock('../core')

const { saveConfiguration, readConfiguration } = require('../project')

describe('project configuration', () => {
  const configuration = {
    plugins: [],
    pluginsPath: '/path/packages',
  }

  it('should success save project configuration', () => {
    expect(saveConfiguration(configuration, '/path')).toBeFalsy()
  })

  it('should success read project configuration', () => {
    require('../core').setMockModules({
      '/path/.rispa.json': configuration,
    })
    expect(readConfiguration('/path')).toEqual(configuration)
  })
})
