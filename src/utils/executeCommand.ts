import { spawn, ChildProcess, ExecOptions } from 'node:child_process'

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
  args: string[],
  options?: Options,
) {
  return new Promise<string>((resolve, reject) => {
    const childProcess = spawn(command, args, options)
    childProcesses.push(childProcess)
    let errString = ''
    let outString = ''
    if (childProcess.stdout) {
      if (options?.stdoutPipe) childProcess.stdout.pipe(options.stdoutPipe || process.stdout)
      childProcess.stdout.on('data', (chunk) => {
        if (options?.outFn) options.outFn(chunk)
        outString += chunk
      })
    }
    if (childProcess.stderr) {
      if (options?.stderrPipe) childProcess.stderr.pipe(options.stderrPipe || process.stderr)
      childProcess.stderr.on('data', (chunk) => {
        if (options?.errFn) options.errFn(chunk)
        errString += chunk
      })
    }

    childProcess.on('close', (code) => {
      if (code && code > 0) {
        reject(new Error(`command '${command} exited with code ${code}':\n${errString}`))
        return
      }
      resolve(outString)
    })
  })
}
