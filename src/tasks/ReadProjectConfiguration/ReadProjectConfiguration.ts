import { Task } from 'noladius'
import * as path from 'path'
import { CONFIGURATION_PATH } from '../../constants/project'
import ProjectConfiguration from '../../common/ProjectConfiguration'
import { readJson } from '../../helpers/files'

export type State = {
  projectConfiguration?: ProjectConfiguration
}

export type Params = {
  projectPath: string
}

function readConfiguration(configurationPath: string): ProjectConfiguration {
  try {
    return readJson<ProjectConfiguration>(configurationPath, true)
  } catch (e) {
    throw new Error('Can\'t find rispa project config')
  }
}

class ReadProjectConfiguration extends Task<State, Params>{
  static defaultParams = {
    projectPath: process.cwd(),
  }

  run() {
    const { projectPath } = this.params
    const configurationPath = path.resolve(projectPath, CONFIGURATION_PATH)

    const configuration = readConfiguration(configurationPath)

    this.setState({
      projectConfiguration: configuration,
    })
  }
}

export default ReadProjectConfiguration
