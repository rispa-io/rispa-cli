import Plugin from '../../common/Plugin'
import RunPluginsScriptsActions from '../../tasks/RunPluginsScripts/actions'
import { ProjectPackageInfo } from '../../common/PackageInfo'

export type MapArgs = {
  pluginName?: string,
  scriptName?: string,
  args?: string[],
}

export type State = {
  projectPath: string,
  plugins: Plugin[],
  selectedPlugins: Plugin[],
  projectPackageInfo?: ProjectPackageInfo,
} & MapArgs

export type Actions = RunPluginsScriptsActions
