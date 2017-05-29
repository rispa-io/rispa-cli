const configureGenerators = require('@rispa/generator')

const { handleError } = require('../core')
const { scanPackages } = require('../packages')

const argsToParams = args => (args
  .filter(arg => arg.indexOf('=') !== -1)
  .reduce((params, arg) => {
    const idxDelimiter = arg.indexOf('=')
    params[arg.slice(0, idxDelimiter)] = args.slice(idxDelimiter)
    return params
  }, {})
)

const generate = async (packageName, generatorName, ...args) => {
  const projectPath = process.cwd()

  const packages = scanPackages(projectPath)

  const packageInfo = packages[packageName]

  if (!packageInfo) {
    handleError(`Can't find plugin with name: ${packageName}`)
  }

  const generatorsPaths = Object.values(packages)
    .map(({ generatorsPath }) => generatorsPath)
    .filter(generatorsPath => generatorsPath)
    .filter((generatorsPath, idx, values) => values.indexOf(generatorsPath) === idx)

  const generators = configureGenerators(packageInfo.path, generatorsPaths)

  if (!generators.containsGenerator(generatorName)) {
    handleError(`Can't find generator with name: ${generatorName}`)
  }

  await generators.getGenerator(generatorName).runActions(argsToParams(args))

  process.exit(1)
}

module.exports = generate
