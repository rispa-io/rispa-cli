/* eslint-disable no-console, import/no-dynamic-require, global-require */

const { cloneRepository } = require('./git')

function installPlugins(pluginsNames, plugins, installedPluginsNames, pluginsPath) {
  plugins.filter(({ name }) => pluginsNames.indexOf(name) !== -1)
    .forEach(({ name, clone_url: cloneUrl }) => {
      if (installedPluginsNames.indexOf(name) === -1) {
        console.log(`Install plugin with name: ${name}`)
        cloneRepository(cloneUrl, pluginsPath)
      } else {
        console.log(`Already installed plugin with name: ${name}`)
      }
    })
}

module.exports = {
  installPlugins,
}
