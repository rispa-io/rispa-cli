import { Task } from 'noladius'
import Plugin from '../../common/Plugin'
import Actions, { runningScriptAction } from './actions'
import * as path from 'path'
import { runPackageScript } from '../../helpers/script'

export type State = {
  args: string[]
  projectPath: string
  scriptName: string
  selectedPlugins: Plugin[]
}

class RunPluginsScripts extends Task<State, object, Actions> {
  run() {
    const { projectPath, selectedPlugins, scriptName, args } = this.state

    selectedPlugins.forEach(plugin => {
      this.dispatch(runningScriptAction(plugin, scriptName))

      const cwd = path.resolve(projectPath, plugin.path)

      const status = runPackageScript(cwd, scriptName, args, 'inherit')
      if (status !== 0) {
        throw new Error('Failed run plugin script')
      }
    })
  }
}

export default RunPluginsScripts
