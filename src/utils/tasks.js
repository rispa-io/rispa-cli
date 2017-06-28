const { isPromise } = require('./promise')
const { DEV_MODE, TEST_MODE } = require('../constants')

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

const checkDevMode = ctx => (ctx.mode || (ctx.configuration && ctx.configuration.mode)) === DEV_MODE

const checkTestMode = ctx => (ctx.mode || (ctx.configuration && ctx.configuration.mode)) === TEST_MODE

const checkNotProdMode = ctx => checkTestMode(ctx) || checkDevMode(ctx)

const skipDevMode = ctx => checkDevMode(ctx) && 'Development mode'

const skipTestMode = ctx => checkTestMode(ctx) && 'Testing mode'

const skipNotProdMode = ctx => skipDevMode(ctx) || skipTestMode(ctx)

module.exports = {
  createTaskWrapper,
  improveTask,
  extendsTask,
  checkDevMode,
  skipDevMode,
  checkTestMode,
  skipTestMode,
  skipNotProdMode,
  checkNotProdMode,
}
