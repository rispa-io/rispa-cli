declare module 'walk-sync' {
  interface WalkSyncOptions {
    globs?: string[],
    directories?: boolean,
    ignore?: string[],
  }

  function walkSync(baseDir: string, options: WalkSyncOptions | string[]): string[]
  export = walkSync
}
