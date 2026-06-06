import { useState } from 'react'
import { keccak256, toBytes } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import { readClient } from '../../lib/readClient'

export default function NameLookup({ projectId, projectSlug, onSelect }) {
  const [name, setName]       = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleLookup = async () => {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return
    setLoading(true); setResult(null); setError('')
    try {
      const nameHash = keccak256(toBytes(trimmed))
      const node     = await readClient.readContract({
        address: RWAID_ADDRESS, abi: RWAID_ABI,
        functionName: 'nameNodeFromHash', args: [BigInt(projectId), nameHash],
      })
      const results = await readClient.multicall({
        contracts: [
          { address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'nodeToTokenId', args: [node] },
          { address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'nodeClaimed',   args: [node] },
          { address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'revoked',       args: [BigInt(projectId), nameHash] },
        ],
        allowFailure: true,
      })
      const tokenId  = results[0].result ?? 0n
      const isClaimed  = results[1].result ?? false
      const isRevoked  = results[2].result ?? false
      setResult({ name: trimmed, tokenId: tokenId.toString(), isClaimed, isRevoked })
    } catch (err) {
      setError(err.shortMessage || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="field">
        <label className="field-label">Look up a name</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="d-input" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="e.g. joe"
              value={name}
              onChange={e => { setName(e.target.value); setResult(null); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
            <span className="suffix">.{projectSlug}.rwa-id.eth</span>
          </div>
          <button onClick={handleLookup} disabled={!name.trim() || loading} className="btn btn-primary">
            {loading ? '…' : 'Look up'}
          </button>
        </div>
        <span className="field-hint">Hashes the name and queries the contract directly. No event scanning.</span>
      </div>

      {error && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 10 }}>{error}</p>}

      {result && (
        <div className={`lookup-result${result.isRevoked ? '' : result.isClaimed ? '' : ''}`}
          style={result.isRevoked
            ? { borderColor: 'var(--warn-line)', background: 'var(--warn-soft)' }
            : result.isClaimed
            ? {}
            : { borderColor: 'var(--line)', background: 'var(--paper-2)' }
          }>
          <div className="lookup-icon"
            style={result.isRevoked ? { background: 'var(--warn)' } : !result.isClaimed ? { background: 'var(--ink-4)' } : {}}>
            {result.isRevoked ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13"/>
              </svg>
            ) : result.isClaimed ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8.5l3 3L13 5"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="8" cy="8" r="5.5"/><path d="M8 5v3M8 11v.5"/>
              </svg>
            )}
          </div>
          <div>
            <div className="lookup-name">{result.name}.{projectSlug}.rwa-id.eth</div>
            <div className="lookup-meta">
              {result.isRevoked
                ? 'Revoked — name is blacklisted'
                : result.isClaimed
                ? `Token #${result.tokenId}`
                : 'Not yet claimed'}
            </div>
          </div>
          {result.isClaimed && !result.isRevoked && onSelect && (
            <button onClick={() => onSelect(result.tokenId)} className="btn btn-sm">
              Select #{result.tokenId}
            </button>
          )}
          {!result.isClaimed && !result.isRevoked && (
            <span className="tag tag-neutral">Unclaimed</span>
          )}
          {result.isRevoked && (
            <span className="tag tag-warn">Revoked</span>
          )}
        </div>
      )}
    </div>
  )
}
