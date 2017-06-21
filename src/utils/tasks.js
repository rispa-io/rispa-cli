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

const extendsTask = (task, options) => improveTask(Object.assign({}, task, options))

const checkDevMode = ctx => (ctx.mode || (ctx.configuration && ctx.configuration.mode)) === 'dev'

const skipDevMode = ctx => checkDevMode(ctx) && 'Development mode'

module.exports = {
  createTaskWrapper,
  improveTask,
  extendsTask,
  checkDevMode,
  skipDevMode,
}
