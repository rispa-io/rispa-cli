const { prompt } = require('inquirer')
const { commit: gitCommit, push: gitPush } = require('../utils/git')

const enterCommitMessage = () => prompt([{
  type: 'input',
  name: 'commitMessage',
  message: 'Enter commit message (leave empty to skip):',
}])

const createCommitAndPushPluginChanges = (path, changes) => ({
  title: 'Commit changes',
  task: () => {
    // #TODO: make separete tests to mock console.log
    console.log(changes)

    return enterCommitMessage(path).then(({ commitMessage }) => {
      if (commitMessage) {
        if (!gitCommit(path, commitMessage)) {
          throw new Error('Failed git commit')
        }

        if (!gitPush(path)) {
          throw new Error('Failed git push')
        }
      }
    })
  },
})

module.exports = createCommitAndPushPluginChanges
