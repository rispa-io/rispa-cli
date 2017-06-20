const Listr = require('listr')

const isPromise = obj => !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'

const createTaskWrapper = ({ before, after, task }) => (context, wrapper) => {
  if (before) {
    before(context, wrapper)
  }

  const result = task(context, wrapper)

  if (isPromise(result)) {
    return result.then(() => after && after(context, wrapper))
  }

  after(context, wrapper)
  return result
}

const improveTask = task => {
  if (task.after || task.before) {
    task.task = createTaskWrapper(task)
  }

  return task
}

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
