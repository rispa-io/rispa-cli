const path = require('path')

module.exports = {
  description: 'Generator for project structure',
  prompts: [],
  actions: () => ([
    {
      type: 'add',
      path: './{{ projectName}}/.editorconfig',
      templateFile: './.editorconfig.hbs',
      abortOnFail: false,
    },
    {
      type: 'add',
      path: './{{ projectName}}/.gitignore',
      templateFile: './.gitignore.hbs',
      abortOnFail: false,
    },
    {
      type: 'add',
      path: './{{ projectName}}/.travis.yml',
      templateFile: './.travis.yml.hbs',
      abortOnFail: false,
    },
    {
      type: 'add',
      path: './{{ projectName}}/lerna.json',
      templateFile: './lerna.json.hbs',
      abortOnFail: true,
    },
    {
      type: 'add',
      path: './{{ projectName}}/package.json',
      templateFile: './package.json.hbs',
      abortOnFail: true,
    },
  ].map(item => {
    item.templateFile = path.resolve(__dirname, item.templateFile)
    item.path = path.resolve(process.cwd(), item.path)
    return item
  })),
}
