// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { decryptBackup, encryptBackup } from './encryptedBackup'

describe('encrypted backups', () => {
  it('round-trips data without storing plaintext', async () => {
    const value = { profile: 'Example', grossPence: 12530 }
    const encrypted = await encryptBackup(value, 'correct horse battery staple')
    expect(encrypted).not.toContain('Example')
    await expect(decryptBackup(encrypted, 'correct horse battery staple')).resolves.toEqual(value)
  })

  it('rejects a wrong passphrase', async () => {
    const encrypted = await encryptBackup({ ok: true }, 'correct horse battery staple')
    await expect(decryptBackup(encrypted, 'wrong passphrase')).rejects.toThrow(/could not unlock/i)
  })
})
