export default interface Plugin {
  name?: string,
  packageName: string,
  path: string,
  scripts: string[],
  activator?: string,
  generators?: string,
}

export function findPluginByName(plugins: Plugin[], pluginName: string): Plugin | undefined {
  return plugins.find((plugin: Plugin) => plugin.name === pluginName || plugin.packageName === pluginName)
}
