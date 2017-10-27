# Rispa CLI [![Build Status](https://api.travis-ci.org/rispa-io/rispa-cli.svg?branch=master)](https://travis-ci.org/rispa-io/rispa-cli)

`ris` is the Rispa CLI command line utility that allows to set up project structure, manage plugins, run generators.

* [Getting Started](#getting-started) – How to use.
* [Features](#features) – About features.

Rispa CLI works on macOS, Windows, and Linux.

## Getting Started

### Installation

Install it once globally: 
```sh 
yarn global add @rispa/cli 
``` 

or

```sh
npm install -g @rispa/cli
```

**You will need to have Node >= 7.10 on your machine**.

### Creating project

To create project, run:

```sh
ris new project-name
cd project-name
```

<img width="682" alt="ris new" src="https://user-images.githubusercontent.com/6418302/27534033-4bba4102-5a6e-11e7-8aec-e3adbf3a3ff6.png">

It will create a directory called `project-name` inside the current folder.<br>
Inside that directory, it will generate the initial project structure and install the selected plugins:

```
project-name/
  rispa.json
  lerna.json
  package.json
  .gitignore
  .editorconfig
  .travis.yml
  packages/
    ...selected-plugins
```

`rispa.json` is an entry point of **RISPA** project, it contains information about current project.

#### Options
##### Development mode
To create project in development mode, run:

```sh
ris new --mode=dev
```

Project will be generated without Subtree usage.

### Managing plugins

### `ris add`

To add plugins, run inside project directory:
```sh
ris add rispa-eslint-config
```

<img width="682" alt="ris add" src="https://user-images.githubusercontent.com/6418302/27534034-4bc0bad2-5a6e-11e7-87c7-db36bd099680.png">

It will add plugin with name `rispa-eslint-config` to current project.

If you want to browse and select plugins to install, run:

```sh
ris add
```

<img width="682" alt="ris add" src="https://user-images.githubusercontent.com/6418302/27534032-4bb73ae8-5a6e-11e7-96c9-153ed14d8146.png">

It will display available plugins. Press `space` to select plugins for installation, then press `enter` to install selected plugins.

If you want to add plugin via `git` url, run:

```sh
ris add git:https://github.com/rispa-io/rispa-core.git
```

It will add `rispa-core` plugin via git url to current project.

### `ris update`

To update installed plugins, run inside project directory:

```sh
ris update
```

It will pull changes to all installed plugins in current project.

**Pulling changes works through the `git` interface.**

### `ris remove`

To remove a plugin, run inside project directory:

```sh
ris remove plugin-name
```

It will remove `plugins-name` plugin from current project.

**Plugin removal is an unsafe operation,**<br/>
**because, it doesn't make changes to the client code**<br/>
**and requires corrections by user.**

### `ris assemble`

To assemble plugins, run inside project directory:

```sh
ris assemble
```
<img width="682" alt="ris assemble" src="https://user-images.githubusercontent.com/6418302/27585679-e2ba310c-5b45-11e7-830a-179e32c0e3e3.png">

It will install not installed plugins from `rispa.json`.

### Launch plugin script
### `ris run` or `ris`

To launch plugin script, run inside project directory:

```sh
ris run @rispa/core lint
```

<img width="682" alt="ris run" src="https://user-images.githubusercontent.com/6418302/27534216-e7d3aa88-5a6e-11e7-8d28-798bacec715a.png">

It will launch script `lint` in `@rispa/core` plugin.

### `ris run all` or `ris all`

To launch script for all plugins, run inside project directory:

```sh
ris run all lint
```
<img width="682" alt="ris run all lint" src="https://user-images.githubusercontent.com/6418302/27534031-4bb23476-5a6e-11e7-816d-55c67b6fcac0.png">

It will launch script `lint` for all installed plugins.

#### Options
##### Yarn
To force or disable usage of *Yarn*, use `--yarn`:
```sh
ris run all lint --yarn=true
```
##### Skip
To skip plugins, use `--skip`:
```sh
ris run all lint --skip=@rispa/ui-kit,feature-plugin
```

### Launch generator
### `ris g`

To launch plugin generator, run inside project directory:

```sh
ris g core generator-name
```
<img width="682" alt="ris g" src="https://user-images.githubusercontent.com/6418302/27534030-4bafa45e-5a6e-11e7-9b12-5f013a7a39c5.png">

It will launch `generator-name` generator of `core` package in current project.

### Commit
### `ris commit`

To commit project or plugins changes, run inside project directory:

```sh
ris commit
```

It will collect project changes and ask you to enter commit message. The commit will be pushed to the current branch.

<img width="682" alt="2017-06-26 13 01 18" src="https://user-images.githubusercontent.com/6418302/27534441-ad43721c-5a6f-11e7-8787-e2e7619b0a8b.png">

### Numerate
### `ris numerate`

To numerate project changes, run inside project directory:

```sh
ris numerate
```

It will scan project tags and display available versions.

<img width="682" alt="ris numerate" src="https://user-images.githubusercontent.com/6418302/27534948-635376f0-5a71-11e7-8db7-0aa879e3bd1b.png">

## Features

### Run local version

If you launched the globally installed CLI and there will be local version found, the call will be redirected to the local version.

### Subtree

We use [Subtree](https://www.kernel.org/pub/software/scm/git/docs/howto/using-merge-subtree.html) merge strategy for plugins.

### Structure

Generated project based on [Lerna](https://github.com/lerna/lerna) *monorepo* structure.

### Plugins

Plugins are a part of *monorepo* modules, they extend the project functionality.<br/>

[@rispa/core](https://github.com/rispa-io/rispa-core) - is an entry point for all plugins, providing enhancements and correct initialization of connected plugins.

List of available plugins can be seen [here](https://github.com/search?q=topic%3Arispa-plugin+org%3Arispa-io&type=Repositories).

## Configuration

To see the full details of an error, run CLI with ENV:
```sh
DEBUG=rispa:* ris new
```
