const githubApi = jest.genMockFromModule('../githubApi')

let mockPlugins = []
let mockPluginsExtendable = []
let mockPluginNamePackageJson = {}

githubApi.setMockPlugins = newMockPlugins => {
  mockPlugins = newMockPlugins
}

githubApi.setMockPluginsExtendable = newMockPluginsExtendable => {
  mockPluginsExtendable = newMockPluginsExtendable
}

githubApi.setMockPluginNamePackageJson = newMockPluginNamePackageJson => {
  mockPluginNamePackageJson = newMockPluginNamePackageJson
}

githubApi.plugins = () => Promise.resolve(mockPlugins)

githubApi.pluginsExtendable = () => Promise.resolve(mockPluginsExtendable)

githubApi.pluginPackageJson = pluginName => {
  const packageJson = mockPluginNamePackageJson[pluginName]
  if (packageJson) {
    return Promise.resolve(packageJson)
  }
  return Promise.reject()
}

module.exports = githubApi
