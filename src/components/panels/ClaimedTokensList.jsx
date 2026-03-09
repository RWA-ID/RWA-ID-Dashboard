import { useState, useEffect } from 'react'
import { RWAID_ADDRESS } from '../../lib/contracts'
import { getLogsChunked } from '../../lib/readClient'
import { formatUnits } from 'viem'

// Fetches all IdentityClaimed events for a given projectId and renders a
// searchable list. Calls onSelect(tokenId) when user clicks a row.
export default function ClaimedTokensList({ projectId, onSelect }) {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      setError('')
      try {
        const logs = await getLogsChunked({
          address: RWAID_ADDRESS,
          event: {
            name: 'IdentityClaimed',
            type: 'event',
            inputs: [
              { name: 'projectId', type: 'uint256', indexed: true },
              { name: 'nameHash', type: 'bytes32', indexed: true },
              { name: 'claimer', type: 'address', indexed: true },
              { name: 'tokenId', type: 'uint256', indexed: false },
              { name: 'node', type: 'bytes32', indexed: false },
              { name: 'feePaid', type: 'uint256', indexed: false },
            ],
          },
          args: { projectId: BigInt(projectId) },
        })

        if (!cancelled) {
          setTokens(logs.map(log => ({
            tokenId: log.args.tokenId.toString(),
            claimer: log.args.claimer,
            nameHash: log.args.nameHash,
            feePaid: log.args.feePaid,
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
    return (
      t.tokenId.includes(q) ||
      t.claimer.toLowerCase().includes(q) ||
      t.nameHash.toLowerCase().includes(q)
    )
  })

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-white/50 font-semibold">Claimed Identities</p>
        {!loading && <span className="text-xs text-white/25">{tokens.length} total</span>}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by token ID or claimer wallet address..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20 mb-3"
      />

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-white/30 text-sm">
          <div className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading claims...
        </div>
      ) : error ? (
        <p className="text-red-400 text-xs py-2">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-white/25 text-sm py-4 text-center">
          {tokens.length === 0 ? 'No identities claimed yet.' : 'No results for that search.'}
        </p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {filtered.map(t => (
            <button
              key={t.tokenId}
              onClick={() => onSelect(t.tokenId)}
              className="w-full text-left px-3 py-2.5 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-blue-500/25 rounded-lg transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#3d7fff] font-mono text-sm font-semibold">#{t.tokenId}</span>
                  <span className="text-white/40 text-xs font-mono">
                    {t.claimer.slice(0, 8)}...{t.claimer.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {t.feePaid > 0n && (
                    <span className="text-white/25 text-xs">${formatUnits(t.feePaid, 6)}</span>
                  )}
                  <span className="text-white/20 group-hover:text-blue-400 text-xs transition-colors">Select →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
