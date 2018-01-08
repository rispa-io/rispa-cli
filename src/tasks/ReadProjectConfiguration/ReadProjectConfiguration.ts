import { Task } from 'noladius'
import * as path from 'path'
import { CONFIGURATION_PATH } from '../../constants/project'
import ProjectConfiguration from '../../common/ProjectConfiguration'
import { readJson } from '../../helpers/files'

export type State = {
  projectPath: string
  projectConfiguration?: ProjectConfiguration
}

function readConfiguration(configurationPath: string): ProjectConfiguration {
  try {
    return readJson<ProjectConfiguration>(configurationPath, true)
  } catch (e) {
    throw new Error('Can\'t find rispa project config')
  }
}

class ReadProjectConfiguration extends Task<State>{
  run() {
    const { projectPath } = this.state
    const configurationPath = path.resolve(projectPath, CONFIGURATION_PATH)

    const {
      mode = 'prod',
      plugins = [],
    } = readConfiguration(configurationPath)

    this.setState({
      projectConfiguration: {
        mode,
        plugins,
      },
    })
  }
}

export default ReadProjectConfiguration
