const FORMAT = 'vip-encrypted-backup'
const ITERATIONS = 250_000

interface BackupEnvelope {
  format: typeof FORMAT
  version: 1
  algorithm: 'AES-GCM'
  kdf: 'PBKDF2-SHA-256'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number, usage: KeyUsage[]) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usage,
  )
}

export async function encryptBackup(value: unknown, passphrase: string) {
  if (passphrase.length < 10) throw new Error('Use a backup passphrase of at least 10 characters.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, ITERATIONS, ['encrypt'])
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  const envelope: BackupEnvelope = {
    format: FORMAT,
    version: 1,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  }
  return JSON.stringify(envelope, null, 2)
}

export async function decryptBackup(text: string, passphrase: string): Promise<unknown> {
  let envelope: BackupEnvelope
  try {
    envelope = JSON.parse(text) as BackupEnvelope
  } catch {
    throw new Error('This is not a valid VIP backup file.')
  }
  if (
    envelope.format !== FORMAT
    || envelope.version !== 1
    || envelope.algorithm !== 'AES-GCM'
    || envelope.kdf !== 'PBKDF2-SHA-256'
    || !Number.isInteger(envelope.iterations)
    || envelope.iterations < 100_000
  ) throw new Error('This VIP backup format is not supported.')

  try {
    const salt = fromBase64(envelope.salt)
    const iv = fromBase64(envelope.iv)
    const key = await deriveKey(passphrase, salt, envelope.iterations, ['decrypt'])
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      fromBase64(envelope.ciphertext),
    )
    return JSON.parse(new TextDecoder().decode(plaintext)) as unknown
  } catch {
    throw new Error('VIP could not unlock this backup. Check the passphrase and file.')
  }
}
