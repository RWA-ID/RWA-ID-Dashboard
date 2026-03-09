import { useState } from 'react'
import { keccak256, toBytes } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import { readClient } from '../../lib/readClient'

// Look up a claimed name directly on-chain via nameNodeFromHash + nodeToTokenId.
// No event logs needed — single multicall per search.
export default function NameLookup({ projectId, projectSlug, onSelect }) {
  const [name, setName] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const nameHash = keccak256(toBytes(trimmed))

      // Get ENS node for this name under the project
      const node = await readClient.readContract({
        address: RWAID_ADDRESS,
        abi: RWAID_ABI,
        functionName: 'nameNodeFromHash',
        args: [BigInt(projectId), nameHash],
      })

      // Multicall: tokenId + isClaimed + isRevoked
      const results = await readClient.multicall({
        contracts: [
          { address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'nodeToTokenId', args: [node] },
          { address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'nodeClaimed', args: [node] },
          { address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'revoked', args: [BigInt(projectId), nameHash] },
        ],
        allowFailure: true,
      })

      const tokenId = results[0].result ?? 0n
      const isClaimed = results[1].result ?? false
      const isRevoked = results[2].result ?? false

      setResult({ name: trimmed, tokenId: tokenId.toString(), isClaimed, isRevoked })
    } catch (err) {
      setError(err.shortMessage || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <p className="text-sm text-white/50 font-semibold mb-3">Look up by name</p>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-all">
          <input
            type="text"
            placeholder={`e.g. joe`}
            value={name}
            onChange={e => { setName(e.target.value); setResult(null); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            className="flex-1 bg-transparent px-4 py-2.5 text-white text-sm outline-none placeholder:text-white/20"
          />
          <span className="pr-4 text-white/20 text-xs font-mono">.{projectSlug}.rwa-id.eth</span>
        </div>
        <button
          onClick={handleLookup}
          disabled={!name.trim() || loading}
          className="px-4 py-2 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white text-sm font-semibold rounded-xl transition-all"
        >
          {loading ? '...' : 'Look up'}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {result && (
        <div className={`p-3 rounded-xl border text-sm ${
          result.isRevoked
            ? 'bg-orange-500/5 border-orange-500/20'
            : result.isClaimed
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-white/3 border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-white/70 text-xs mb-1">
                {result.name}.{projectSlug}.rwa-id.eth
              </p>
              {result.isRevoked ? (
                <p className="text-orange-400 text-xs">Revoked — name is blacklisted</p>
              ) : result.isClaimed ? (
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xs">Claimed</span>
                  <span className="text-[#3d7fff] font-mono text-xs font-semibold">Token #{result.tokenId}</span>
                </div>
              ) : (
                <p className="text-white/30 text-xs">Not yet claimed</p>
              )}
            </div>
            {result.isClaimed && !result.isRevoked && (
              <button
                onClick={() => onSelect(result.tokenId)}
                className="px-3 py-1.5 bg-[#3d7fff]/20 hover:bg-[#3d7fff]/30 text-[#3d7fff] text-xs font-semibold rounded-lg transition-all"
              >
                Select #{result.tokenId}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
