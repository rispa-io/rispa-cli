const Listr = require('listr')
const { improveTask } = require('./utils/tasks')
const ListrRender = require('./utils/ListrRender')

class Command extends Listr {
  constructor(options) {
    super(Object.assign({
      renderer: ListrRender,
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
