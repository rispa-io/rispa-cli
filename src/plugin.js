const fs = require('fs-extra')
const path = require('path')
const { prompt } = require('inquirer')
const { handleError } = require('./core')
const { cloneRepository, addSubtree } = require('./git')
const githubApi = require('./githubApi')

const promptPlugins = choices => prompt([{
  type: 'checkbox',
  message: 'Select plugins to install:',
  name: 'plugins',
  choices,
}])

const selectPluginsToInstall = async (installedPluginsNames = []) => {
  const { data: { items: plugins } } = await githubApi.plugins()
  const pluginsToInstall = plugins
    .filter(plugin => installedPluginsNames.indexOf(plugin.name) === -1)
    .map(plugin => ({
      name: plugin.name,
      value: plugin,
    }))

  if (pluginsToInstall.length === 0) {
    handleError('Can\'t find plugins for install')
  }

  return (await promptPlugins(pluginsToInstall)).plugins
}

const installPlugins = (plugins, projectPath, pluginsPath, mode) => {
  fs.ensureDirSync(pluginsPath)

  plugins.forEach(({ name, clone_url: cloneUrl }) => {
    console.log(`Install plugin with name: ${name}`)

    if (mode === 'dev') {
      const pluginsRelPath = path.relative(projectPath, pluginsPath)
      const prefix = `${pluginsRelPath}/${name}`
      addSubtree(projectPath, prefix, name, cloneUrl)
    } else {
      cloneRepository(cloneUrl, pluginsPath)
    }
  })
}

module.exports = {
  selectPluginsToInstall,
  installPlugins,
}
