import fs from 'node:fs'

const exists = (filePath: string) =>
  fs.promises.access(filePath).then(() => true).catch(() => false)

export default exists
