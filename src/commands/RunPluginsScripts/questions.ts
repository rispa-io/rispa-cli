import { prompt } from 'inquirer'
import Plugin from '../../common/Plugin'

export function requestSelectPlugin(plugins: Plugin[]) {
  const pluginsForSelect: string[] = plugins
    .filter(plugin => plugin.scripts.length > 0)
    .map((plugin: Plugin) => plugin.name || plugin.packageName)

  return prompt([{
    type: 'list',
    name: 'pluginName',
    message: 'Select plugin for run',
    paginated: true,
    choices: pluginsForSelect,
  }]).then(({ pluginName }) => {
    return pluginName
  })
}

export function requestSelectScript(plugin: Plugin) {
  const scripts = plugin.scripts

  return prompt([{
    type: 'list',
    name: 'scriptName',
    message: 'Select script for run',
    paginated: true,
    choices: scripts,
  }]).then(({ scriptName }) => {
    return scriptName
  })
}
