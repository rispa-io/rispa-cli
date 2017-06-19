const inquirer = jest.genMockFromModule('inquirer')

let mockAnswers = {
}

inquirer.setMockAnswers = newMockAnswers => { mockAnswers = newMockAnswers }

inquirer.prompt = jest.fn(questions => (
  Promise.resolve(questions.reduce((answers, { name }) => (
    Object.assign(answers, {
      [name]: mockAnswers[name],
    })
  ), {}))
))

module.exports = inquirer
