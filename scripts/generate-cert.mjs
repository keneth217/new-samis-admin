import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import selfsigned from 'selfsigned'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certDir = path.join(__dirname, '..', 'cert')

const notAfter = new Date()
notAfter.setFullYear(notAfter.getFullYear() + 1)

const pems = await selfsigned.generate(
  [{ name: 'commonName', value: 'localhost' }],
  {
    algorithm: 'sha256',
    notAfterDate: notAfter,
    extensions: [
      { name: 'basicConstraints', cA: false, critical: true },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
      { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: '::1' },
        ],
      },
    ],
  }
)

fs.mkdirSync(certDir, { recursive: true })
fs.writeFileSync(path.join(certDir, 'key.pem'), pems.private)
fs.writeFileSync(path.join(certDir, 'cert.pem'), pems.cert)
console.log('Generated cert/key.pem and cert/cert.pem in ./cert/')
