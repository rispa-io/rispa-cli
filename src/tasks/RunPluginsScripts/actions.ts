import { Action, createAction } from 'noladius'
import Plugin from '../../common/Plugin'

export type RunningScriptAction = Action<'RUN_PLUGINS_SCRIPTS/RUNNING_SCRIPT', {
  plugin: Plugin
  scriptName: string
}>

export const runningScriptAction = createAction<RunningScriptAction>(
  'RUN_PLUGINS_SCRIPTS/RUNNING_SCRIPT',
  (plugin: Plugin, scriptName: string): RunningScriptAction['payload'] => ({ plugin, scriptName }),
)

type Actions = RunningScriptAction

export default Actions
