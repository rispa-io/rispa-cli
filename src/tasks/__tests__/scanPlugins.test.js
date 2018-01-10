jest.mock('cross-spawn')
jest.mock('fs-extra')
jest.mock('glob')

const path = require.requireActual('path')
const {
  PLUGIN_PREFIX,
  PLUGIN_ACTIVATOR,
  PLUGIN_GENERATORS,
  PACKAGE_JSON_PATH,
  PLUGIN_ALIAS,
  PLUGINS_CACHE_PATH,
  NODE_MODULES_PLUGINS_PATH,
} = require.requireActual('../../constants')

const mockFs = require.requireMock('fs-extra')
const mockGlob = require.requireMock('glob')

const scanPlugins = require.requireActual('../scanPlugins')

describe('scan plugins', () => {
  beforeEach(() => {
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
    mockGlob.setMockPaths({})
  })

  const projectPath = '/cwd'
  const pluginNames = ['rispa-core', 'rispa-webpack']
  const packageJsonPath = path.resolve(projectPath, PACKAGE_JSON_PATH)
  const workspacesPackagesPath = 'packages/'
  const pluginsPath = path.resolve(projectPath, workspacesPackagesPath)
  const pluginsScanPath = path.resolve(projectPath, `${workspacesPackagesPath}*`)
  const plugins = pluginNames.map((pluginName, idx) => {
    const plugin = {
      name: pluginName,
      packageName: pluginName.replace('rispa-', PLUGIN_PREFIX),
      path: path.resolve(pluginsPath, `./${pluginName}`),
      npm: false,
      postinstall: undefined,
    }

    if (idx % 2) {
      plugin.packageAlias = pluginName.replace('rispa-', '')
      plugin.scripts = ['build']
      plugin.activator = path.resolve(plugin.path, './activator.js')
      plugin.generators = path.resolve(plugin.path, './generators.js')
    } else {
      plugin.packageAlias = undefined
      plugin.scripts = []
      plugin.activator = false
      plugin.generators = false
    }

    return plugin
  })

  const pluginsPaths = plugins.map(plugin => plugin.path)

  const pluginsFiles = plugins.reduce((result, plugin) => {
    if (plugin.activator) {
      result.push(plugin.activator)
    }
    if (plugin.generators) {
      result.push(plugin.generators)
    }
    return result
  }, [])

  const packageJsonFiles = plugins.reduce((result, plugin) => {
    const packagesJsonPath = path.resolve(plugin.path, PACKAGE_JSON_PATH)

    result[packagesJsonPath] = {
      name: plugin.packageName,
      [PLUGIN_ALIAS]: plugin.packageAlias,
      [PLUGIN_ACTIVATOR]: plugin.activator,
      [PLUGIN_GENERATORS]: plugin.generators,
      scripts: plugin.scripts.length && plugin.scripts
        .reduce((scripts, scriptName) => Object.assign(scripts, { [scriptName]: '' }), {}),
    }

    return result
  }, {})

  const projectFiles = {
    [packageJsonPath]: {
      workspaces: [`${workspacesPackagesPath}*`],
    },
  }

  it('should success scan plugins', () => {
    mockGlob.setMockPaths({
      [pluginsScanPath]: pluginsPaths,
    })

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, projectFiles))

    mockFs.setMockFiles(pluginsFiles)

    const context = {
      projectPath,
    }

    expect(() => scanPlugins.task(context)).not.toThrow()

    expect(context).toHaveProperty('projectPath', projectPath)
    expect(context).toHaveProperty('plugins', plugins)
  })

  it('should success scan plugins with invalid plugin in `node_modules`', () => {
    const nodeModulesPluginsPath = path.resolve(projectPath, NODE_MODULES_PLUGINS_PATH)
    const invalidPluginName = 'invalid-plugin'
    const invalidPluginPath = path.resolve(nodeModulesPluginsPath, `./${invalidPluginName}`)
    mockGlob.setMockPaths({
      [pluginsScanPath]: pluginsPaths,
      [path.resolve(projectPath, NODE_MODULES_PLUGINS_PATH)]: [invalidPluginPath],
    })

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, projectFiles, {
      [path.resolve(invalidPluginPath, PACKAGE_JSON_PATH)]: {
        name: invalidPluginName,
      },
    }))

    mockFs.setMockFiles(pluginsFiles)

    const context = {
      projectPath,
    }

    expect(() => scanPlugins.task(context)).not.toThrow()

    expect(context).toHaveProperty('projectPath', projectPath)
    expect(context).toHaveProperty('plugins', plugins)
  })

  it('should success scan plugins from cache', () => {
    mockFs.setMockJson(Object.assign({}, packageJsonFiles, projectFiles, {
      [path.resolve(projectPath, PLUGINS_CACHE_PATH)]: {
        plugins,
      },
    }))

    const context = {
      projectPath,
    }

    expect(() => scanPlugins.task(context)).not.toThrow()

    expect(context).toHaveProperty('projectPath', projectPath)
    expect(context).toHaveProperty('plugins', plugins)
  })

  it('should success scan plugins and packages are not plugins', () => {
    const invalidPluginPath = path.resolve(pluginsPath, './invalid-plugin')
    mockGlob.setMockPaths({
      [pluginsScanPath]: [invalidPluginPath].concat(pluginsPaths),
    })

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, projectFiles))

    mockFs.setMockFiles(pluginsFiles)

    const context = {
      projectPath,
    }

    expect(() => scanPlugins.task(context)).not.toThrow()

    expect(context).toHaveProperty('projectPath', projectPath)
    expect(context).toHaveProperty('plugins', plugins)
  })

  it('should success scan plugins with empty workspaces', () => {
    mockGlob.setMockPaths({
      [pluginsScanPath]: pluginsPaths,
    })

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, {
      [packageJsonPath]: false,
    }))

    mockFs.setMockFiles(pluginsFiles)

    const context = {
      projectPath,
    }

    expect(() => scanPlugins.task(context)).not.toThrow()
  })
})
