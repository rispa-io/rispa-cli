import { Task } from 'noladius'
import * as path from 'path'
import * as fs from 'fs-extra'
import { ProjectPackageInfo } from '../../common/PackageInfo'
import { PACKAGE_JSON_PATH } from '../../constants/packages'

export type State = {
  projectPath: string
  projectPackage?: ProjectPackageInfo
}

class ReadProjectPackageInfo extends Task<State>{
  run() {
    const { projectPath = process.cwd() } = this.state

    const packagePath = path.resolve(projectPath, PACKAGE_JSON_PATH)
    const packageInfo: ProjectPackageInfo | undefined = fs.readJsonSync(packagePath, { throws: false })

    if (!packageInfo) {
      throw new Error('Can\'t find package.json')
    }

    const {
      name,
      scripts = {},
      workspaces = [],
      dependencies = {},
      devDependencies = {},
    } = packageInfo

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
