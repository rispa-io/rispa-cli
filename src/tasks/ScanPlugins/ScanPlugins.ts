import { Task } from 'noladius'
import * as path from 'path'
import * as fs from 'fs-extra'
import walk = require('walk-sync')
import PackageInfo, { ProjectPackageInfo } from '../../common/PackageInfo'
import {
  PACKAGE_JSON_PATH, PACKAGE_RISPA_ACTIVATOR, PACKAGE_RISPA_GENERATORS, PACKAGE_RISPA_KEY,
  PACKAGE_RISPA_NAME,
} from '../../constants/packages'
import Plugin from '../../common/Plugin'
import { readJson } from '../../helpers/files'

export type State = {
  projectPath: string
  projectPackageInfo: ProjectPackageInfo
  plugins: Plugin[]
}

function convertDependencies(dependencies: ProjectPackageInfo['dependencies']): string[] {
  return Object.keys(dependencies)
    .map(dependencyName => `node_modules/${dependencyName}/${PACKAGE_JSON_PATH}`)
}

function convertWorkspaces(workspaces: string[]) {
  return workspaces.map(workspace => `${workspace}/${PACKAGE_JSON_PATH}`)
}

function checkSymLink(packagePath: string) {
  return !fs.lstatSync(path.dirname(packagePath)).isSymbolicLink()
}

function checkPlugin([, packageInfo]: [string, object]) {
  return Object.keys(packageInfo)
    .some(key => key.startsWith(PACKAGE_RISPA_KEY))
}

function readPackageInfo(packagePath: string): [string, object] {
  const packageInfo = readJson<PackageInfo>(packagePath)

  return [packagePath, packageInfo]
}

function scanPlugin([packagePath, packageInfo]: [string, PackageInfo]): Plugin {
  const pluginRootPath = path.dirname(packagePath)

  const plugin: Plugin = {
    name: packageInfo[PACKAGE_RISPA_NAME],
    packageName: packageInfo.name,
    path: pluginRootPath,
    scripts: packageInfo.scripts ? Object.keys(packageInfo.scripts) : [],
    activator: packageInfo[PACKAGE_RISPA_ACTIVATOR],
    generators: packageInfo[PACKAGE_RISPA_GENERATORS],
  }

  return plugin
}

class ScanPlugins extends Task<State> {
  run() {
    const { projectPath, projectPackageInfo } = this.state

    const patterns = [
      ...convertDependencies(projectPackageInfo.dependencies),
      ...convertDependencies(projectPackageInfo.devDependencies),
      ...convertWorkspaces(projectPackageInfo.workspaces),
    ]

    const plugins = walk(projectPath, patterns)
      .filter(checkSymLink)
      .map(readPackageInfo)
      .filter(checkPlugin)
      .map(scanPlugin)

    this.setState({
      plugins,
    })
  }
}

export default ScanPlugins
