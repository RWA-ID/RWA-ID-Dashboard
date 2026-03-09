import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { isAddress } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function TransferOwnershipPanel({ projectId, project, onRefresh }) {
  const [newOwner, setNewOwner] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) onRefresh()

  const isValid = isAddress(newOwner)

  const handleSubmit = () => {
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'transferProjectOwnership',
      args: [BigInt(projectId), newOwner],
    })
  }

  return (
    <div>
      <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">Transfer Project Ownership</h3>
      <p className="text-white/40 text-sm mb-6">
        Transfer full control of this project to another address. <strong className="text-amber-400">This action is irreversible</strong> — you will lose all owner privileges.
      </p>

      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-6">
        <p className="text-amber-400 text-sm">⚠️ Once transferred, you will no longer be able to manage this project from this wallet.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/60 mb-1 block">Current Owner</label>
          <p className="text-white/50 text-sm font-mono bg-white/5 rounded-lg px-3 py-2 break-all">
            {project.owner}
          </p>
        </div>

        <div>
          <label className="text-sm text-white/60 mb-1 block">New Owner Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={newOwner}
            onChange={e => { setNewOwner(e.target.value); setConfirmed(false) }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-amber-500/50 transition-all placeholder:text-white/20"
          />
          {newOwner && !isValid && <p className="text-red-400 text-xs mt-1">Enter a valid Ethereum address</p>}
        </div>

        {isValid && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm text-white/60">
              I understand this transfers ownership to <span className="text-amber-400 font-mono">{newOwner.slice(0,6)}...{newOwner.slice(-4)}</span> and cannot be undone.
            </span>
          </label>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || !confirmed || isPending || isConfirming}
          className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-white/10 disabled:text-white/30 text-amber-400 border border-amber-500/20 font-semibold rounded-xl transition-all"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Transfer Ownership'}
        </button>
        {isSuccess && <p className="text-green-400 text-sm text-center">✓ Ownership transferred</p>}
      </div>
    </div>
  )
}
