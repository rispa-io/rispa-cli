import { Command, commandOptions } from '../../common/Command'
import { MapArgs, State, Actions } from './definitions'
import ReadProjectPackageInfo from '../../tasks/ReadProjectPackageInfo'
import ScanPlugins from '../../tasks/ScanPlugins/ScanPlugins'
import Plugin, { findPluginByName } from '../../common/Plugin'
import { requestSelectScript, requestSelectPlugin } from './questions'
import RunPluginsScriptsTask from '../../tasks/RunPluginsScripts'
import reducer from './reducer'
import { ProjectPackageInfo } from '../../common/PackageInfo'

@commandOptions({
  name: 'run',
  mapArgsToState([pluginName = '', scriptName = '', ...args]): MapArgs {
    return {
      pluginName,
      scriptName,
      args,
    }
  },
})
class RunPluginsScripts extends Command<State, object, Actions> {
  state: State = {
    pluginName: '',
    scriptName: '',
    args: [],
    projectPath: process.cwd(),
    plugins: [],
    selectedPlugins: [],
    projectPackageInfo: {} as ProjectPackageInfo,
  }

  willRun() {
    this.registerReducer('logger', reducer)
  }

  selectPlugin = async () => {
    const { plugins, scriptName } = this.state

    if (plugins.length === 0) {
      throw new Error('Can\'t find plugins')
    }

    const pluginName = this.state.pluginName || await requestSelectPlugin(plugins)

    if (pluginName === 'all') {
      const selectedPlugins = plugins.filter((plugin: Plugin) => (
        plugin.scripts.indexOf(scriptName) !== -1
      ))

      if (selectedPlugins.length === 0) {
        throw new Error(`Can\'t find plugins with script '${scriptName}'`)
      }

      this.setState({
        selectedPlugins,
      })
    } else {
      const plugin: Plugin | undefined = findPluginByName(plugins, pluginName)

      if (!plugin) {
        throw new Error(`Can\'t find plugin with name '${pluginName}'`)
      }

      this.setState({
        selectedPlugins: [plugin],
      })
    }
  }

  selectScriptName = async () => {
    const { selectedPlugins: [plugin] } = this.state

    if (!this.state.scriptName) {
      const scriptName = await requestSelectScript(plugin)

      this.setState({
        scriptName,
      })
    }
  }

  run() {
    return [
      ReadProjectPackageInfo,
      ScanPlugins,
      this.selectPlugin,
      this.selectScriptName,
      RunPluginsScriptsTask,
    ]
  }
}

export default RunPluginsScripts
