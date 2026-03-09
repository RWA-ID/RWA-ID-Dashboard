import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { isAddress } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function TreasuryPanel({ projectId, project, onRefresh }) {
  const [newTreasury, setNewTreasury] = useState('')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) onRefresh()

  const isValid = isAddress(newTreasury)

  const handleSubmit = () => {
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'updateTreasury',
      args: [BigInt(projectId), newTreasury],
    })
  }

  return (
    <div>
      <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">Update Treasury</h3>
      <p className="text-white/40 text-sm mb-6">
        Change the address that receives 70% of claim fees for this project.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/60 mb-1 block">Current Treasury</label>
          <p className="text-white/50 text-sm font-mono bg-white/5 rounded-lg px-3 py-2 break-all">
            {project.treasury}
          </p>
        </div>

        <div>
          <label className="text-sm text-white/60 mb-1 block">New Treasury Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={newTreasury}
            onChange={e => setNewTreasury(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
          />
          {newTreasury && !isValid && <p className="text-red-400 text-xs mt-1">Enter a valid Ethereum address</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid || isPending || isConfirming}
          className="w-full py-3 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Update Treasury'}
        </button>
        {isSuccess && <p className="text-green-400 text-sm text-center">✓ Treasury updated</p>}
      </div>
    </div>
  )
}
