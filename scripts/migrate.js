const path = require('node:path')
const { spawn } = require('node:child_process')
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

dotenvExpand.expand(dotenv.config({ path: path.resolve(__dirname, '..', '.env.development') }))

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

async function main() {
  try {
    await run('npm', ['run', 'services:up'])
    await run('npm', ['run', 'services:wait:database'])
    await run('prisma', ['migrate', 'dev', ...process.argv.slice(2)])
  } catch (err) {
    console.error('Erro:', err.message)
    process.exit(1)
  }
}

main()
