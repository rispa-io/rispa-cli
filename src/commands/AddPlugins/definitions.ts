import { ProjectPackageInfo } from '../../common/PackageInfo'
import ProjectConfiguration from '../../common/ProjectConfiguration'

export type MapArgs = {
  installPluginNames: string[]
  devMode: boolean
}

export type State = {
  projectPath: string
  projectPackageInfo: ProjectPackageInfo
  projectConfiguration: ProjectConfiguration
} & MapArgs

export type Actions = any
