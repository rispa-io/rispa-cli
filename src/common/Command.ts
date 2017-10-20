import {
  Action, Noladius, NoladiusConstructor,
} from 'noladius'

export interface CommandOptions {
  name: string
  description?: string
  mapArgsToParams?: (args: string[]) => object
  mapArgsToState?: (args: string[]) => object
}

export function commandOptions(options: CommandOptions) {
  return function (target: any) {
    target.options = options
  }
}

export interface CommandConstructor extends NoladiusConstructor {
  options: CommandOptions
}

export abstract class Command<
  State extends object = {},
  Params extends object = {},
  Actions extends Action = Action
> extends Noladius<State, Params, Actions> {
  static options: CommandOptions = {} as CommandOptions

  public get state(): State {
    return this.store.getState()
  }

  public set state(state: State) {
    this.store.setState(state)
  }
}
