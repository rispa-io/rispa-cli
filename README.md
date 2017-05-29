# Rispa CLI [![Build Status](https://api.travis-ci.org/rispa-io/rispa-cli.svg?branch=master)](https://travis-ci.org/rispa-io/rispa-cli)

`ris` is the Rispa CLI command line utility allowing the creation of project structure, managing plugins, run generators.

## Getting Started

### Installation

Install it once globally:
```sh
npm install -g @rispa/cli
```

**You’ll need to have Node >= 7.10 on your machine**.

### Creating project

To create project, run:

```sh
ris new project-name
cd project-name
```

It will create a directory called `project-name` inside the current run folder.<br>
Inside that directory, it will generate the initial project structure and install the selected plugins:

```
project-name/
  .rispa.json
  lerna.json
  package.json
  .gitignore
  .editorconfig
  .travis.yml
  packages/
    ...selected-plugins
```

`.rispa.json` - is entry point of **RISPA** project, it contains information of current project.

### Managing plugins

### `ris add`

To add plugins, run:
```sh
cd project-name
ris add plugin-name
```

It will add plugin with name `plugin-name` in current run project.

If you want browse and select plugins to install, run:

```sh
cd project-name
ris add
```

It will display available plugins, press `space` to select plugin to installation, finally press `enter` to install selected plugins.

### `ris update`

To update installed plugins, run:

```sh
cd project-name
ris update
```

It will pull changes in all installed plugins in current run project.

**The pull changes works through the `git` interface**

### `ris remove`

To remove plugin, run:

```sh
cd project-name
ris remove plugin-name
```

It will remove plugins with name `plugins-name` from current run project.

### Launch plugin script
### `ris run` or `ris`

To launch plugin script, run:

```sh
cd project-name
ris run plugin-name lint
```

It will launch script `lint` in plugin with name `plugin-name`.

### `ris run all` or `ris all`

To launch script in all plugins, run:

```sh
cd project-name
ris run all lint
```

It will launch script `lint` in all installed plugins.

### Launch generator
### `ris g`

To launch package generator, run:

```sh
cd project-name
ris g ui generator-name
```

It will launch generator with name `generator-name` of package `ui` in current run project.

<!--## Philosophy
* **Modularity:** Logical separation into modules.<br/>
Horizontal scalability within the project.

* **Plugin Infrastructure:** Easy management of necessary capabilities.<br/>
Simple upgrade project modules.-->
