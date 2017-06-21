const { isPromise } = require('./promise')

const createTaskWrapper = ({ before, after, task }) => (context, wrapper) => {
  if (before) {
    before(context, wrapper)
  }

  const result = task(context, wrapper)

  if (isPromise(result)) {
    return result.then(() => after && after(context, wrapper))
  }

  if (after) {
    after(context, wrapper)
  }

  return result
}

const improveTask = task => {
  if (!task.wrapped && (task.after || task.before)) {
    task.task = createTaskWrapper(task)
    task.wrapped = true
  }

  return task
}

const extendsTask = (task, options) => Object.assign({}, task, options)

const skipDevMode = ctx => (ctx.mode || ctx.configuration.mode) === 'dev' && 'Development mode'

module.exports = {
  createTaskWrapper,
  improveTask,
  extendsTask,
  skipDevMode,
}
