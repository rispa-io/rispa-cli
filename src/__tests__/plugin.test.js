jest.resetAllMocks()
jest.mock('cross-spawn')

const { installPlugins } = require.requireActual('../plugin')

describe('manipulation with plugins', () => {
  it('should success install plugins', () => {
    const installPluginsNames = ['core', 'eslint-config']
    const plugins = installPluginsNames.map(name => ({
      name, clone_url: 'url',
    }))
    const installedPluginsNames = ['core']

    expect(installPlugins(installPluginsNames, plugins, installedPluginsNames, 'path')).toHaveLength(1)
  })
})
