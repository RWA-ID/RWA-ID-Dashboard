import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { isAddress } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function TransferOwnershipPanel({ projectId, project, onRefresh }) {
  const [newOwner, setNewOwner]     = useState('')
  const [confirmed, setConfirmed]   = useState(false)

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess }          = useWaitForTransactionReceipt({ hash })

  useEffect(() => { if (isSuccess) onRefresh() }, [isSuccess])

  const isValid = isAddress(newOwner)

  const handleSubmit = () => {
    writeContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'transferProjectOwnership',
      args: [BigInt(projectId), newOwner] })
  }

  return (
    <section className="section">
      <h2 className="section-title">Transfer ownership</h2>
      <p className="section-desc">
        Transfer full control of this project to another address. This action is irreversible — you will lose all owner privileges immediately.
      </p>

      <div className="danger-zone" style={{ maxWidth: 560 }}>
        <h3>Transfer ownership</h3>

        <div className="callout warn" style={{ marginBottom: 14 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M8 3l6 10H2L8 3z"/><path d="M8 7v3M8 11.5v.5"/>
          </svg>
          Once transferred, you will no longer be able to manage this project from this wallet.
        </div>

        <div className="field">
          <span className="field-label">Current owner</span>
          <div className="d-input mono disabled">
            <input type="text" value={project.owner} disabled style={{ color: 'var(--ink-2)' }} />
          </div>
        </div>

        <div className="field">
          <label className="field-label">New owner address</label>
          <div className="d-input mono">
            <input
              type="text"
              placeholder="0x…"
              value={newOwner}
              onChange={e => { setNewOwner(e.target.value); setConfirmed(false) }}
            />
          </div>
          {newOwner && !isValid && <span style={{ color: 'var(--bad)', fontSize: 12 }}>Enter a valid Ethereum address</span>}
          <span className="field-hint">The new owner immediately gains full admin control.</span>
        </div>

        {isValid && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, width: 14, height: 14, accentColor: 'var(--bad)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
              I understand this transfers ownership to{' '}
              <code style={{ fontFamily: 'var(--f-mono)', color: 'var(--bad)' }}>{newOwner.slice(0,6)}…{newOwner.slice(-4)}</code>
              {' '}and cannot be undone.
            </span>
          </label>
        )}

        {error && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 10 }}>{error.shortMessage || error.message}</p>}

        <button onClick={handleSubmit} disabled={!isValid || !confirmed || isPending || isConfirming} className="btn btn-danger">
          {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Transfer ownership'}
        </button>
        {isSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, marginTop: 8 }}>✓ Ownership transferred</p>}
      </div>
    </section>
  )
}
