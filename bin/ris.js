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
const { runner } = require('noladius')

const CWD = process.cwd()
const CLI_REPOSITORY_NAME = 'rispa-cli'

const RunPluginsScriptsCommand = require('../lib/commands/RunPluginsScripts').default

const commands = [
  RunPluginsScriptsCommand,
]

const logError = createDebug('rispa:error:cli')

const handleError = e => {
  console.log(`  ${chalk.red.bold('Error:')} ${chalk.yellow(e.message || e)}`)
  logError(e)
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
  let Command = commands.find(command => command.options.name === firstArg)
  if (!Command) {
    Command = RunPluginsScriptsCommand
    args.unshift(firstArg)
  }

  let initialState = {}
  let params = {}
  if ('mapArgsToState' in Command.options) {
    initialState = Command.options.mapArgsToState(args)
  }
  if ('mapArgsToParams' in Command.options) {
    params = Command.options.mapArgsToParams(args)
  }

  runner(Command, params, initialState)
    .catch(handleError)
}

const getYarnPrefix = () => {
  // Source: https://github.com/yarnpkg/yarn/blob/3901ba4e17edf0a835fb17a42e4da15238d6cd58/src/constants.js#L60
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'Yarn', 'config', 'global')
  }

  return path.join(os.homedir(), '.config', 'yarn', 'global')
}

const inGlobalYarn = fullPath => fullPath.indexOf(getYarnPrefix()) === 0

const inGlobalNpm = fullPath => fullPath.indexOf(globalPrefix) === 0

const isGlobalRun = () => {
  const execPath = fs.realpathSync(process.argv[1])

  return inGlobalNpm(execPath) || inGlobalYarn(execPath)
}

const canRunLocalVersion = () => {
  const packageJsonPath = path.resolve(CWD, './package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return false
  }

  const { dependencies = {}, devDependencies = {} } = fs.readJsonSync(packageJsonPath)

  const deps = Object.keys(dependencies).concat(Object.keys(devDependencies))
  if (deps.indexOf('@rispa/cli') !== -1) {
    const localVersionPath = path.resolve(CWD, './node_modules/.bin/ris')
    if (fs.existsSync(localVersionPath)) {
      return true
    }

    console.log(chalk.red(`Can't find local version of CLI in ${chalk.cyan('node_modules')}`))
    process.exit(1)
  }

  return false
}

const readLocalPluginPath = () => {
  const rispaJsonPath = path.resolve(CWD, './rispa.json')
  const { pluginsPath } = fs.readJsonSync(rispaJsonPath)

  const pluginPackageJsonPath = path.resolve(CWD, pluginsPath, CLI_REPOSITORY_NAME, PACKAGE_JSON_PATH)
  const { bin = {} } = fs.readJsonSync(pluginPackageJsonPath)

  return path.resolve(CWD, pluginsPath, CLI_REPOSITORY_NAME, bin.ris)
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

  if (plugins.indexOf(CLI_REPOSITORY_NAME) !== -1) {
    if (pluginBinExists(path.join(pluginsPath, CLI_REPOSITORY_NAME))) {
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
  const localPath = path.resolve(CWD, './node_modules/.bin/ris')
  // Run local version from node_modules directly - on Windows it will be shell script, on other systems - js file with execute permission
  runLocalVersion(localPath, args)
} else if (globalRun && canRunPlugin()) {
  // Run local version from plugin with node - on all systems it will be js file
  runLocalVersion('node', [readLocalPluginPath()].concat(args))
} else {
  runCommand(args)
}
