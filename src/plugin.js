const { cloneRepository } = require('./git')

function installPlugins(pluginsNames, plugins, installedPluginsNames, pluginsPath) {
  return plugins.filter(({ name }) => pluginsNames.indexOf(name) !== -1)
    .filter(({ name, clone_url: cloneUrl }) => {
      if (installedPluginsNames.indexOf(name) === -1) {
        console.log(`Install plugin with name: ${name}`)
        cloneRepository(cloneUrl, pluginsPath)
        return true
      }

      console.log(`Already installed plugin with name: ${name}`)
      return false
    })
}

module.exports = {
  installPlugins,
}
