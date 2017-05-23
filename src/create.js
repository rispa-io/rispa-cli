'use strict';

const { prompt } = require('inquirer')

const { handleError } = require('./core');
const githubApi = require('./githubApi');

async function create(projectName, ...args) {
  try {
    if (!projectName) {
      projectName = (await enterProjectName()).projectName;
    }

    const { data: { items: plugins } } = await githubApi.plugins();

    const { installPlugins } = await selectInstallPlugins(plugins);

    console.log("projectName", projectName);
    console.log("installPlugins", installPlugins);
  } catch (e) {
    handleError(e);
  }
}

function enterProjectName() {
  return prompt([{
    type: 'input',
    name: 'projectName',
    message: 'Enter project name:'
  }])
}

function selectInstallPlugins(plugins) {
  return prompt([{
    type: 'checkbox',
    message: 'Select install plugins:',
    name: 'installPlugins',
    choices: plugins
  }])
}

module.exports = create;