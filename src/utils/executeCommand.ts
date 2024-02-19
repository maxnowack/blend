import { exec, ChildProcess, ExecOptions } from 'child_process'

const childProcesses: ChildProcess[] = []
process.on('exit', () => {
  childProcesses.forEach((cp) => {
    cp.kill()
  })
})
export default function executeCommand(
  command: string,
  options?: ExecOptions,
  outFn?: (data: any) => void,
  errFn?: (data: any) => void,
) {
  return new Promise<string>((resolve, reject) => {
    const spawn = exec(command, options)
    childProcesses.push(spawn)
    let errString = ''
    let outString = ''
    if (spawn.stdout) {
      spawn.stdout.on('data', (chunk) => {
        if (outFn) outFn(chunk)
        outString += chunk
      })
    }
    if (spawn.stderr) {
      spawn.stderr.on('data', (chunk) => {
        if (errFn) errFn(chunk)
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
