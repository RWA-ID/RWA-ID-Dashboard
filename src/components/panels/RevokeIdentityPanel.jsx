import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import { readClient } from '../../lib/readClient'
import NameLookup from './NameLookup'

export default function RevokeIdentityPanel({ projectId, project, onRefresh }) {
  const [tokenId, setTokenId] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [meta, setMeta] = useState(null)

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) { onRefresh(); setTokenId(''); setConfirmed(false); setMeta(null) }
  }, [isSuccess])

  // Fetch tokenMetadata via readClient whenever tokenId changes
  useEffect(() => {
    const id = Number(tokenId)
    if (!tokenId || id <= 0) { setMeta(null); return }
    readClient.readContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'tokenMetadata',
      args: [BigInt(tokenId)],
    }).then(result => {
      const arr = Array.isArray(result) ? result : Object.values(result)
      setMeta({ projectId: arr[0], nameHash: arr[1], claimedAt: arr[2] })
    }).catch(() => setMeta(null))
  }, [tokenId])

  const belongsToProject = meta && meta.projectId.toString() === projectId.toString()

  const handleRevoke = () => {
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'revokeIdentity',
      args: [BigInt(projectId), BigInt(tokenId)],
    })
  }

  const handleSelect = (id) => {
    setTokenId(id)
    setConfirmed(false)
  }

  return (
    <div>
      <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">Revoke Identity</h3>
      <p className="text-white/40 text-sm mb-6">
        Burns a token, clears its ENS mapping (gateway returns <code className="text-blue-300 bg-white/5 px-1 rounded">address(0)</code>),
        and permanently blacklists the name from being re-claimed.
      </p>

      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
        <p className="text-red-400 text-sm">🚫 This is permanent. The identity cannot be restored once revoked.</p>
      </div>

      {/* Name lookup */}
      <NameLookup projectId={projectId} projectSlug={project?.slug} onSelect={handleSelect} />

      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/60 mb-1 block">Token ID to Revoke</label>
          <input
            type="number"
            placeholder="e.g. 42"
            value={tokenId}
            onChange={e => { setTokenId(e.target.value); setConfirmed(false) }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500/50 transition-all placeholder:text-white/20"
          />
        </div>

        {tokenId && meta && (
          <div className={`p-3 rounded-xl text-sm ${
            belongsToProject
              ? 'bg-white/5 border border-white/10'
              : 'bg-red-500/5 border border-red-500/20'
          }`}>
            {belongsToProject ? (
              <p className="text-white/60">Token #{tokenId} belongs to <span className="text-blue-400">Project #{meta.projectId?.toString()}</span></p>
            ) : (
              <p className="text-red-400">Token #{tokenId} does not belong to this project (Project #{meta.projectId?.toString()})</p>
            )}
          </div>
        )}

        {tokenId && meta && belongsToProject && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="w-4 h-4 accent-red-500"
            />
            <span className="text-sm text-white/60">
              I understand token <span className="text-red-400 font-mono">#{tokenId}</span> will be permanently burned and the name blacklisted.
            </span>
          </label>
        )}

        {error && <p className="text-red-400 text-xs">{error.shortMessage || error.message}</p>}

        <button
          onClick={handleRevoke}
          disabled={!tokenId || !belongsToProject || !confirmed || isPending || isConfirming}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 disabled:bg-white/10 disabled:text-white/30 text-red-400 border border-red-500/20 font-semibold rounded-xl transition-all"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : '🚫 Revoke Identity'}
        </button>
        {isSuccess && <p className="text-green-400 text-sm text-center">✓ Identity revoked</p>}
      </div>
    </div>
  )
}
