const VERSION = 1

const migrate = configuration => {
  const migratedConfiguration = Object.assign({}, configuration)

  migratedConfiguration.plugins = configuration.plugins.map(pluginName => {
    const plugin = {}
    plugin.name = pluginName

    if (configuration.remotes && configuration.remotes[pluginName]) {
      plugin.remote = configuration.remotes[pluginName]
    }

    return plugin
  })

  delete migratedConfiguration.remotes

  migratedConfiguration.version = VERSION

  return migratedConfiguration
}

module.exports = migrate
