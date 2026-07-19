import { useState } from 'react'
import { decryptBackup, encryptBackup } from '../services/encryptedBackup'

interface Props {
  getBackupStore: () => unknown
  restoreBackupStore: (value: unknown) => void
}

export function BackupControls({ getBackupStore, restoreBackupStore }: Props) {
  const [passphrase, setPassphrase] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const exportBackup = async () => {
    setError('')
    setStatus('Encrypting backup…')
    try {
      const encrypted = await encryptBackup(getBackupStore(), passphrase)
      const url = URL.createObjectURL(new Blob([encrypted], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `vip-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      setStatus('Encrypted backup downloaded. Keep the file and passphrase separately.')
    } catch (caught) {
      setStatus('')
      setError(caught instanceof Error ? caught.message : 'VIP could not create the backup.')
    }
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    setError('')
    setStatus('Unlocking backup…')
    try {
      const value = await decryptBackup(await file.text(), passphrase)
      if (!window.confirm('Replace every profile on this device with this backup?')) {
        setStatus('Backup import cancelled.')
        return
      }
      restoreBackupStore(value)
      setStatus('Backup restored. Calendar subscription links are intentionally not included in backups.')
    } catch (caught) {
      setStatus('')
      setError(caught instanceof Error ? caught.message : 'VIP could not restore the backup.')
    }
  }

  return <section className="card">
    <div className="section-heading"><div><span className="eyebrow">Recovery</span><h2>Encrypted device backup</h2></div></div>
    <p>Download an encrypted copy of profiles, shifts and pay rules. Calendar subscription links are excluded.</p>
    <label className="wide">Backup passphrase<input type="password" minLength={10} autoComplete="new-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label>
    <button className="secondary-button" disabled={passphrase.length < 10} onClick={() => void exportBackup()}>Download encrypted backup</button>
    <label className="file-button">Restore encrypted backup<input type="file" accept="application/json,.json" disabled={passphrase.length < 10} onChange={(event) => { void importBackup(event.target.files?.[0]); event.target.value = '' }} /></label>
    {status && <p className="sync-status" role="status">{status}</p>}
    {error && <p className="sync-error" role="alert">{error}</p>}
    <p className="safety-note">VIP cannot recover a forgotten backup passphrase. Store it separately from the file.</p>
  </section>
}
