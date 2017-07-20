const R = require('ramda')
const spawn = require('cross-spawn')
const path = require('path')
const { readDependencies } = require('./plugin')
const { readConfiguration } = require('./project')

const installPresetYarn = (preset, projectPath) => {
  const result = spawn.sync('yarn', ['add', preset], { cwd: projectPath, stdio: 'inherit' })

  if (result.status !== 0) {
    throw new Error('Failed install preset via yarn')
  }

  return result
}

const installPresetNpm = (preset, projectPath) => {
  const result = spawn.sync('npm', ['install', preset, '--save'], { cwd: projectPath, stdio: 'inherit' })

  if (result.status !== 0) {
    throw new Error('Failed install preset via npm')
  }

  return result
}

const findPresetInDependencies = (presetName, projectPath) => {
  const dependencies = readDependencies(projectPath)

  const preset = R.compose(
    R.propOr(null, 0),
    R.find(([name, version]) => name === presetName || R.contains(presetName, version)),
    Object.entries,
  )(dependencies)

  return preset
}

const readPresetConfiguration = (presetName, projectPath) => {
  const preset = findPresetInDependencies(presetName, projectPath)
  if (!preset) {
    throw new Error(`Can't find preset ${presetName}`)
  }

  const presetPath = path.resolve(projectPath, './node_modules', `./${preset}`)

  const configuration = readConfiguration(presetPath)
  if (!configuration) {
    throw new Error(`Can't read preset configuration ${presetName}`)
  }

  return configuration
}

module.exports = {
  findPresetInDependencies,
  readPresetConfiguration,
  installPresetYarn,
  installPresetNpm,
}
