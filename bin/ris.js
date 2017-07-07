#!/usr/bin/env node

// TODO: Add text for sudo block reason
require('sudo-block')()

const spawn = require('cross-spawn')
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const os = require('os')
const createDebug = require('debug')
const globalPrefix = require('global-prefix')
const { CONFIGURATION_PATH, CLI_PLUGIN_NAME, CWD, LOCAL_VERSION_PATH, PACKAGE_JSON_PATH } = require('../src/constants')

const RunPluginScriptCommand = require('../src/commands/runPluginScript')
const CreateProjectCommand = require('../src/commands/createProject')
const AddPluginsCommand = require('../src/commands/addPlugins')
const RemovePluginsCommand = require('../src/commands/removePlugins')
const UpdatePluginsCommand = require('../src/commands/updatePlugins')
const GenerateCommand = require('../src/commands/generate')
const CommitCommand = require('../src/commands/commit')
const AssembleCommand = require('../src/commands/assemble')
const CleanCacheCommand = require('../src/commands/cleanCache')
const ReleaseCommand = require('../src/commands/release')

const commands = [
  RunPluginScriptCommand,
  CreateProjectCommand,
  AddPluginsCommand,
  RemovePluginsCommand,
  UpdatePluginsCommand,
  GenerateCommand,
  CommitCommand,
  AssembleCommand,
  ReleaseCommand,
  CleanCacheCommand,
]

const logError = createDebug('rispa:error:cli')

const handleError = e => {
  logError(e)
  if (e.errors) {
    e.errors.forEach(error => logError(error))
  }
  if (e.context) {
    logError('Context:')
    logError(e.context)
  }
  process.exit(1)
}

const parseArgs = args => {
  const paramRegExp = /^--([^=]+)=(.*)/
  const argv = args.filter(arg => !paramRegExp.test(arg))

  const params = args.reduce((result, arg) => {
    const paramMatch = paramRegExp.exec(arg)
    if (paramMatch) {
      try {
        result[paramMatch[1]] = JSON.parse(paramMatch[2])
      } catch (e) {
        result[paramMatch[1]] = paramMatch[2]
      }
    }
    return result
  }, {})

  return [argv, params]
}

const runCommand = ([firstArg = '', ...args]) => {
  let Command = commands.find(command => command.commandName === firstArg)
  if (!Command) {
    Command = RunPluginScriptCommand
    args.unshift(firstArg)
  }

  const [argv, params] = parseArgs(args)

  const command = new Command(argv)
  command.init()
  command.run(Object.assign(params, {
    cwd: CWD,
  })).catch(handleError)
}

const getYarnPrefix = () => {
  // Source: https://github.com/yarnpkg/yarn/blob/3901ba4e17edf0a835fb17a42e4da15238d6cd58/src/constants.js#L60
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'Yarn', 'config', 'global')
  }

  return path.join(os.homedir(), 'config', 'yarn', 'global')
}

const inGlobalYarn = fullpath => fullpath.indexOf(getYarnPrefix()) === 0

const inGlobalNpm = fullpath => fullpath.indexOf(globalPrefix) === 0

const isGlobalRun = () => {
  const execPath = fs.realpathSync(process.argv[1])

  return inGlobalNpm(execPath) || inGlobalYarn(execPath)
}

const canRunLocalVersion = () => {
  const packageJsonPath = path.resolve(CWD, PACKAGE_JSON_PATH)

  if (!fs.existsSync(packageJsonPath)) {
    return false
  }

  const { dependencies = {}, devDependencies = {} } = fs.readJsonSync(packageJsonPath)

  const deps = Object.keys(dependencies).concat(Object.keys(devDependencies))
  if (deps.indexOf('@rispa/cli') !== -1) {
    if (fs.existsSync(LOCAL_VERSION_PATH)) {
      return true
    }

    console.log(chalk.red(`Can't find local version of CLI in ${chalk.cyan('node_modules')}`))
    process.exit(1)
  }

  return false
}

const readLocalPluginPath = () => {
  const rispaJsonPath = path.resolve(CWD, CONFIGURATION_PATH)
  const { pluginsPath } = fs.readJsonSync(rispaJsonPath)

  const pluginPackageJsonPath = path.resolve(CWD, pluginsPath, CLI_PLUGIN_NAME, PACKAGE_JSON_PATH)
  const { bin = {} } = fs.readJsonSync(pluginPackageJsonPath)

  return path.resolve(CWD, pluginsPath, CLI_PLUGIN_NAME, bin.ris)
}

const pluginBinExists = pluginPath => {
  const pluginPackageJsonPath = path.resolve(CWD, pluginPath, PACKAGE_JSON_PATH)

  if (!fs.existsSync(pluginPackageJsonPath)) {
    return false
  }

  const { bin = {} } = fs.readJsonSync(pluginPackageJsonPath)
  if (!bin.ris) {
    return false
  }

  return fs.existsSync(path.resolve(CWD, pluginPath, bin.ris))
}

const canRunPlugin = () => {
  const rispaJsonPath = path.resolve(CWD, CONFIGURATION_PATH)

  if (!fs.existsSync(rispaJsonPath)) {
    return false
  }

  const { plugins = [], pluginsPath } = fs.readJsonSync(rispaJsonPath)

  if (plugins.indexOf(CLI_PLUGIN_NAME) !== -1) {
    if (pluginBinExists(path.join(pluginsPath, CLI_PLUGIN_NAME))) {
      return true
    }

    console.log(chalk.red(`Can't find local version of CLI in ${chalk.cyan(pluginsPath)}`))
    process.exit(1)
  }

  return false
}

const runLocalVersion = (execPath, args) => {
  console.log(chalk.bold.green('Switch to use local version'))

  const result = spawn.sync(
    execPath,
    args,
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    }
  ).status

  process.exit(result)
}

const args = process.argv.slice(2)

const globalRun = isGlobalRun()

if (globalRun && canRunLocalVersion()) {
  // Run local version from node_modules directly - on Windows it will be shell script, on other systems - js file with execute permission
  runLocalVersion(LOCAL_VERSION_PATH, args)
} else if (globalRun && canRunPlugin()) {
  // Run local version from plugin with node - on all systems it will be js file
  runLocalVersion('node', [readLocalPluginPath()].concat(args))
} else {
  runCommand(args)
}
