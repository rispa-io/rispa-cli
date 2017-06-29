const { isPromise } = require('./promise')
const { SKIP_REASONS } = require('../constants')

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
    return Object.assign({}, task, {
      task: createTaskWrapper(task),
      wrapped: true,
    })
  }

  return task
}

const extendsTask = (task, options) => improveTask(Object.assign({}, task, options))

const extractMode = ctx => ctx.mode || (ctx.configuration && ctx.configuration.mode)

const checkMode = (ctx, ...modes) => {
  const mode = extractMode(ctx)
  return modes.indexOf(mode) !== -1 && mode
}

const skipMode = (...modes) => ctx => SKIP_REASONS[checkMode(ctx, ...modes)]

module.exports = {
  createTaskWrapper,
  improveTask,
  extendsTask,
  skipMode,
  checkMode,
}
