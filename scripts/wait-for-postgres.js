const { exec } = require('node:child_process')

function checkPostgres() {
  exec('docker exec coopers-to-do-list pg_isready --host localhost', handleResult)

  function handleResult(error, stdout) {
    if (stdout.search('accepting connections') === -1) {
      process.stdout.write('.')
      checkPostgres()
      return
    }

    console.log('\n\nGo! Go! Go!\n')
    console.log('🟢 Postgres is ready and accepting TCP/IP connections!\n')
  }
}

process.stdout.write('\n🔴 Waiting for Postgres to accept connections.')
checkPostgres()
