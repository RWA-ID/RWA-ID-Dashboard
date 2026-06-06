import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import { readClient } from '../../lib/readClient'
import NameLookup from './NameLookup'

export default function RevokeIdentityPanel({ projectId, project, onRefresh }) {
  const [tokenId, setTokenId]     = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [meta, setMeta]           = useState(null)

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess }          = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) { onRefresh(); setTokenId(''); setConfirmed(false); setMeta(null) }
  }, [isSuccess])

  useEffect(() => {
    const id = Number(tokenId)
    if (!tokenId || id <= 0) { setMeta(null); return }
    readClient.readContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'tokenMetadata', args: [BigInt(tokenId)] })
      .then(result => {
        const arr = Array.isArray(result) ? result : Object.values(result)
        setMeta({ projectId: arr[0], nameHash: arr[1], claimedAt: arr[2] })
      })
      .catch(() => setMeta(null))
  }, [tokenId])

  const belongsToProject = meta && meta.projectId.toString() === projectId.toString()

  const handleRevoke = () => {
    writeContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'revokeIdentity',
      args: [BigInt(projectId), BigInt(tokenId)] })
  }

  return (
    <section className="section">
      <h2 className="section-title">Revoke identity</h2>
      <p className="section-desc">
        Burns a token, clears its ENS mapping (gateway returns <code style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>address(0)</code>),
        and permanently blacklists the name from being re-claimed.
      </p>

      <div className="danger-zone" style={{ maxWidth: 560 }}>
        <h3>Revoke identity</h3>

        <div className="callout bad" style={{ marginBottom: 16 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="6"/><path d="M4 4l8 8"/>
          </svg>
          This is permanent. The identity cannot be restored once revoked.
        </div>

        <NameLookup projectId={projectId} projectSlug={project?.slug} onSelect={id => { setTokenId(id); setConfirmed(false) }} />

        <div className="field">
          <label className="field-label">Token ID to revoke</label>
          <div className="d-input mono">
            <input type="number" placeholder="e.g. 42" value={tokenId}
              onChange={e => { setTokenId(e.target.value); setConfirmed(false) }} />
          </div>
        </div>

        {tokenId && meta && (
          <div className={`callout${belongsToProject ? '' : ' bad'}`} style={{ marginBottom: 14 }}>
            {belongsToProject
              ? `Token #${tokenId} belongs to Project #${meta.projectId?.toString()}`
              : `Token #${tokenId} does not belong to this project (Project #${meta.projectId?.toString()})`}
          </div>
        )}

        {tokenId && meta && belongsToProject && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, width: 14, height: 14, accentColor: 'var(--bad)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
              I understand token{' '}
              <code style={{ fontFamily: 'var(--f-mono)', color: 'var(--bad)' }}>#{tokenId}</code>
              {' '}will be permanently burned and the name blacklisted.
            </span>
          </label>
        )}

        {error && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 10 }}>{error.shortMessage || error.message}</p>}

        <button onClick={handleRevoke} disabled={!tokenId || !belongsToProject || !confirmed || isPending || isConfirming} className="btn btn-danger">
          {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Revoke identity'}
        </button>
        {isSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, marginTop: 8 }}>✓ Identity revoked</p>}
      </div>
    </section>
  )
}
