import { createReducer, EventsReducer } from 'noladius'
import chalk from 'chalk'
import figures = require('figures')
import { runningScriptAction, RunningScriptAction } from '../../tasks/RunPluginsScripts/actions'
import { Actions } from './definitions'
import { log } from '../../helpers/loggger'

const handleRunningScriptAction = (action: RunningScriptAction) => {
  const { plugin, scriptName } = action.payload

  const pluginName = plugin.name || plugin.packageName

  log(`${chalk.greenBright.bold(figures.play)} Run plugin ${chalk.cyan.bold(pluginName)} script ${chalk.cyan.bold(scriptName)}`)
}

const reducer: EventsReducer<Actions> = createReducer<Actions>(on => {
  on(runningScriptAction, handleRunningScriptAction)
})

export default reducer
