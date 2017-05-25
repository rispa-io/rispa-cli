/* eslint-disable import/no-dynamic-require, global-require */

jest.resetAllMocks()
jest.mock('cross-spawn')

const { installPlugins } = require('../plugin')

describe('manipulation with plugins', () => {
  it('should success install plugins', () => {
    const installPluginsNames = ['core', 'eslint-config']
    const plugins = installPluginsNames.map(name => ({
      name, clone_url: 'url',
    }))
    const installedPluginsNames = ['core']

    expect(installPlugins(installPluginsNames, plugins, installedPluginsNames, 'path')).toBe(1)
  })
})
