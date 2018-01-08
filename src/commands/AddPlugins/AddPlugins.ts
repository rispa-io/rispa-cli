import { Command, commandOptions } from '../../common/Command'
import { MapArgs, State, Actions } from './definitions'
import ReadProjectPackageInfo from '../../tasks/ReadProjectPackageInfo/ReadProjectPackageInfo'
import ReadProjectConfiguration from '../../tasks/ReadProjectConfiguration/ReadProjectConfiguration'
import ProjectConfiguration from '../../common/ProjectConfiguration'
import { ProjectPackageInfo } from '../../common/PackageInfo'

@commandOptions({
  name: 'add',
  mapArgsToState(args: string[]): MapArgs {
    const devMode = args.some(arg => arg.startsWith('--dev'))
    const installPluginNames = args.filter(arg => !arg.startsWith('--'))

    return {
      installPluginNames,
      devMode,
    }
  },
})
class AddPlugins extends Command<State, object, Actions> {
  state = {
    devMode: false,
    installPluginNames: [],
    projectPath: process.cwd(),
    projectPackageInfo: {} as ProjectPackageInfo,
    projectConfiguration: {} as ProjectConfiguration,
  }

  checkProjectMode = () => {
    const { projectConfiguration } = this.state

    if (projectConfiguration.mode === 'dev') {
      this.setState({
        devMode: true,
      })
    }
  }

  run() {
    return [
      ReadProjectPackageInfo,
      ReadProjectConfiguration,
      this.checkProjectMode,

    ]
  }
}

export default AddPlugins
