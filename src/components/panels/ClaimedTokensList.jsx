import { useState, useEffect } from 'react'
import { RWAID_ADDRESS } from '../../lib/contracts'
import { getLogsChunked } from '../../lib/readClient'
import { formatUnits } from 'viem'

export default function ClaimedTokensList({ projectId, onSelect }) {
  const [tokens, setTokens]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    const fetch = async () => {
      setLoading(true); setError('')
      try {
        const logs = await getLogsChunked({
          address: RWAID_ADDRESS,
          event: {
            name: 'IdentityClaimed', type: 'event',
            inputs: [
              { name: 'projectId', type: 'uint256', indexed: true },
              { name: 'nameHash',  type: 'bytes32', indexed: true },
              { name: 'claimer',   type: 'address', indexed: true },
              { name: 'tokenId',   type: 'uint256', indexed: false },
              { name: 'node',      type: 'bytes32', indexed: false },
              { name: 'feePaid',   type: 'uint256', indexed: false },
            ],
          },
          args: { projectId: BigInt(projectId) },
        })
        if (!cancelled) {
          setTokens(logs.map(log => ({
            tokenId:     log.args.tokenId.toString(),
            claimer:     log.args.claimer,
            nameHash:    log.args.nameHash,
            feePaid:     log.args.feePaid,
            blockNumber: log.blockNumber?.toString() ?? '',
          })))
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load claimed tokens: ' + err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [projectId])

  const filtered = tokens.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.tokenId.includes(q) || t.claimer.toLowerCase().includes(q) || t.nameHash.toLowerCase().includes(q)
  })

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="field-label">Claimed Identities</span>
        {!loading && <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-4)' }}>{tokens.length} total</span>}
      </div>

      <div className="d-input" style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Search by token ID or wallet address…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5, color: 'var(--ink-4)', padding: '8px 0' }}>Loading claims…</p>
      ) : error ? (
        <p style={{ color: 'var(--bad)', fontSize: 12 }}>{error}</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--ink-4)', fontSize: 13, padding: '12px 0' }}>
          {tokens.length === 0 ? 'No identities claimed yet.' : 'No results for that search.'}
        </p>
      ) : (
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table className="d-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Claimer</th>
                <th>Fee paid</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.tokenId}>
                  <td style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>#{t.tokenId}</td>
                  <td className="col-addr">{t.claimer.slice(0, 8)}…{t.claimer.slice(-6)}</td>
                  <td style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-4)' }}>
                    {t.feePaid > 0n ? `$${formatUnits(t.feePaid, 6)}` : '—'}
                  </td>
                  <td className="col-act">
                    <button onClick={() => onSelect(t.tokenId)} className="btn btn-sm">Select</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
