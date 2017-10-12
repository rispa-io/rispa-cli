const RunPluginScriptCommand = require('./src/commands/runPluginScript')
const CreateProjectCommand = require('./src/commands/createProject')
const AddPluginsCommand = require('./src/commands/addPlugins')
const RemovePluginsCommand = require('./src/commands/removePlugins')
const UpdatePluginsCommand = require('./src/commands/updatePlugins')
const GenerateCommand = require('./src/commands/generate')
const CommitCommand = require('./src/commands/commit')
const ReleaseCommand = require('./src/commands/release')
const AssembleCommand = require('./src/commands/assemble')

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
]

const runCommand = (commandName, argv, params, options) => {
  const Command = commands.find(command => command.commandName === commandName)
  if (!Command) {
    throw new Error('Can\'t find command')
  }

  const command = new Command(argv, options)
  return command.run(params)
}

module.exports = {
  runCommand,
}
