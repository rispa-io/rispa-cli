import { Task } from 'noladius'
import * as path from 'path'
import * as fs from 'fs-extra'
import { ProjectPackageInfo } from '../../common/PackageInfo'
import { PACKAGE_JSON_PATH } from '../../constants/packages'
import { readJson } from '../../helpers/files'
import ProjectConfiguration from '../../common/ProjectConfiguration'

export type State = {
  projectPath: string
  projectPackage?: ProjectPackageInfo
}

function readPackageInfo(packagePath: string): ProjectPackageInfo {
  try {
    return readJson<ProjectPackageInfo>(packagePath, true)
  } catch (e) {
    throw new Error('Can\'t find package.json')
  }
}

class ReadProjectPackageInfo extends Task<State>{
  run() {
    const { projectPath } = this.state
    const packagePath = path.resolve(projectPath, PACKAGE_JSON_PATH)

    const {
      name,
      scripts = {},
      workspaces = [],
      dependencies = {},
      devDependencies = {},
    } = readPackageInfo(packagePath)

    this.setState({
      projectPackageInfo: {
        name,
        workspaces,
        dependencies,
        devDependencies,
        scripts,
      },
    })
  }
}

export default ReadProjectPackageInfo
