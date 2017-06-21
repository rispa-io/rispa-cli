const Listr = require('listr')
const { improveTask } = require('./utils/tasks')

class Command extends Listr {
  constructor(options) {
    super(Object.assign({
      renderer: 'verbose',
    }), options)
  }

  add(task) {
    if (Array.isArray(task)) {
      super.add(task.map(improveTask))
    } else {
      super.add(improveTask(task))
    }
  }
}

module.exports = Command
