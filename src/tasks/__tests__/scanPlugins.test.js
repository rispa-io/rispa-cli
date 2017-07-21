jest.mock('cross-spawn')
jest.mock('fs-extra')
jest.mock('glob')

const path = require.requireActual('path')
const {
  PLUGIN_PREFIX,
  PLUGIN_ACTIVATOR_PATH,
  PLUGIN_GENERATORS_PATH,
  LERNA_JSON_PATH,
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
  const lernaJsonPath = path.resolve(projectPath, LERNA_JSON_PATH)
  const lernaPackagesPath = 'packages/'
  const pluginsPath = path.resolve(projectPath, lernaPackagesPath)
  const pluginsScanPath = path.resolve(projectPath, `${lernaPackagesPath}*`)
  const pluginList = pluginNames.map((pluginName, idx) => {
    const plugin = {
      name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      npm: false,
      postinstall: undefined,
      path: path.resolve(pluginsPath, `./${pluginName}`),
    }

    if (idx % 2) {
      plugin.alias = pluginName.replace('rispa-', '')
      plugin.scripts = ['build']
      plugin.activator = path.resolve(plugin.path, PLUGIN_ACTIVATOR_PATH)
      plugin.generators = path.resolve(plugin.path, PLUGIN_GENERATORS_PATH)
    } else {
      plugin.alias = undefined
      plugin.scripts = []
      plugin.activator = false
      plugin.generators = false
    }

    return plugin
  })
  const plugins = pluginList.reduce((result, plugin) => {
    result[plugin.name] = plugin
    return result
  }, {})
  const pluginsPaths = pluginList.map(plugin => plugin.path)

  const pluginsFiles = pluginList.reduce((result, plugin) => {
    if (plugin.activator) {
      result.push(plugin.activator)
    }
    if (plugin.generators) {
      result.push(plugin.generators)
    }
    return result
  }, [])
  const packageJsonFiles = pluginList.reduce((result, plugin) => {
    const packagesJsonPath = path.resolve(plugin.path, PACKAGE_JSON_PATH)
    result[packagesJsonPath] = {
      name: plugin.name,
      [PLUGIN_ALIAS]: plugin.alias,
      scripts: plugin.scripts.length && plugin.scripts.reduce((scripts, scriptName) => Object.assign(scripts, { [scriptName]: '' }), {}),
    }
    return result
  }, {})

  const lernaJsonFile = {
    [lernaJsonPath]: {
      packages: [`${lernaPackagesPath}*`],
    },
  }

  it('should success scan plugins', () => {
    mockGlob.setMockPaths({
      [pluginsScanPath]: pluginsPaths,
    })

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, lernaJsonFile))

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

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, lernaJsonFile, {
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
    mockFs.setMockJson(Object.assign({}, packageJsonFiles, lernaJsonFile, {
      [path.resolve(projectPath, PLUGINS_CACHE_PATH)]: {
        plugins,
        paths: {
          [pluginsScanPath]: pluginList.map(plugin => plugin.name),
        },
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

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, lernaJsonFile))

    mockFs.setMockFiles(pluginsFiles)

    const context = {
      projectPath,
    }

    expect(() => scanPlugins.task(context)).not.toThrow()

    expect(context).toHaveProperty('projectPath', projectPath)
    expect(context).toHaveProperty('plugins', plugins)
  })

  it('should failed scan plugins', () => {
    mockGlob.setMockPaths({
      [pluginsScanPath]: pluginsPaths,
    })

    mockFs.setMockJson(Object.assign({}, packageJsonFiles, {
      [lernaJsonPath]: false,
    }))

    mockFs.setMockFiles(pluginsFiles)

    const context = {
      projectPath,
    }

    expect(() => scanPlugins.task(context)).toThrowError('Incorrect configuration file `lerna.json`')
  })
})
