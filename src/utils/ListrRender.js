const figures = require('figures')
const chalk = require('chalk')
const cliCursor = require('cli-cursor')
const format = require('date-fns/format')
const { LOG_TIME_FORMAT } = require('../constants')

const log = output => {
  const timestamp = format(new Date(), LOG_TIME_FORMAT)

  console.log(`${chalk.green(`[${timestamp}]`)} ${output}`)
}

const createMessage = task => {
  if (task.isPending()) {
    return chalk.blue.bold('[started]')
  } else if (task.state === 'completed') {
    return chalk.green.bold(`[${task.state}]`)
  } else if (task.state === 'failed') {
    return chalk.red.bold(`[${task.state}]`)
  }
  return chalk.bold(`[${task.state}]`)
}

const eventsRender = {
  state: task => {
    const message = createMessage(task)

    log(`${chalk.bold(task.title)} ${message}`)

    if (task.isSkipped() && task.output) {
      log(`${chalk.red(figures.arrowRight)} ${chalk.grey(task.output)}`)
    }
  },
  data: (task, event) => {
    log(chalk.red(`${figures.arrowRight} ${event.data}`))
  },
  title: task => {
    log(`${chalk.blue(task.title)} ${chalk.cyan('[title changed]')}`)
  },
}

const render = tasks => (
  tasks.forEach(task =>
    task.subscribe(
      event => {
        if (event.type === 'SUBTASKS') {
          render(task.subtasks)
        } else {
          const eventRender = eventsRender[event.type.toLowerCase()]
          if (eventRender) {
            eventRender(task, event)
          }
        }
      },
      err => {
        console.log(chalk.bold.red(err))
      }
    )
  )
)

class VerboseRenderer {
  constructor(tasks) {

    this.tasks = tasks

    this.render = () => {
      cliCursor.hide()
      render(this.tasks)
    }
    this.end = () => cliCursor.show()
  }

  static get nonTTY() {
    return true
  }
}

module.exports = VerboseRenderer;