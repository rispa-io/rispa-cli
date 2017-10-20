export default interface PackageInfo {
  [key: string]: any
  name: string
  scripts?: {
    [key: string]: string
  }
  dependencies?: {
    [key: string]: string
  }
  devDependencies?: {
    [key: string]: string
  }
}

export interface ProjectPackageInfo extends PackageInfo {
  scripts: {
    [key: string]: string
  }
  dependencies: {
    [key: string]: string
  }
  devDependencies: {
    [key: string]: string
  }
  workspaces: string[]
}
