import { exec, ChildProcess, ExecOptions } from 'node:child_process'

const childProcesses: ChildProcess[] = []
/* istanbul ignore next -- @preserve */
process.on('exit', () => {
  childProcesses.forEach((cp) => {
    cp.kill()
  })
})
interface Options extends ExecOptions {
  outFn?: (data: any) => void,
  errFn?: (data: any) => void,
  stdoutPipe?: NodeJS.WritableStream,
  stderrPipe?: NodeJS.WritableStream,
}
export default function executeCommand(
  command: string,
  options?: Options,
) {
  return new Promise<string>((resolve, reject) => {
    const spawn = exec(command, options)
    childProcesses.push(spawn)
    let errString = ''
    let outString = ''
    if (spawn.stdout) {
      if (options?.stdoutPipe) spawn.stdout.pipe(options.stdoutPipe || process.stdout)
      spawn.stdout.on('data', (chunk) => {
        if (options?.outFn) options.outFn(chunk)
        outString += chunk
      })
    }
    if (spawn.stderr) {
      if (options?.stderrPipe) spawn.stderr.pipe(options.stderrPipe || process.stderr)
      spawn.stderr.on('data', (chunk) => {
        if (options?.errFn) options.errFn(chunk)
        errString += chunk
      })
    }

    spawn.on('close', (code) => {
      if (code && code > 0) {
        reject(new Error(`command '${command} exited with code ${code}':\n${errString}`))
        return
      }
      resolve(outString)
    })
  })
}
