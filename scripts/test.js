const path = require('node:path')
const { execSync, spawn } = require('node:child_process')
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

dotenvExpand.expand(dotenv.config({ path: path.resolve(__dirname, '..', '.env.development') }))

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    })

    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

async function main() {
  await run('npm', ['run', 'services:up'])
  await run('npm', ['run', 'services:wait:database'])
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env })
  await run('npx', ['jest', '--runInBand'])
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
