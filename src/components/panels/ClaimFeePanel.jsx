import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function ClaimFeePanel({ projectId, project, onRefresh }) {
  const [fee, setFee] = useState('')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { data: minFee } = useReadContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'minimumClaimFee' })

  if (isSuccess) onRefresh()

  const currentFee = project.claimFee > 0n ? formatUnits(project.claimFee, 6) : null
  const minFeeFormatted = minFee ? formatUnits(minFee, 6) : '0.50'

  const handleSubmit = () => {
    const parsed = fee ? parseUnits(fee, 6) : 0n
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'updateClaimFee',
      args: [BigInt(projectId), parsed],
    })
  }

  return (
    <div>
      <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">Update Claim Fee</h3>
      <p className="text-white/40 text-sm mb-6">
        Set the USDC fee required to claim an identity. Leave blank or set to 0 to use the protocol minimum (${minFeeFormatted} USDC).
        Your treasury receives 70%, protocol receives 30%.
      </p>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 p-3 bg-white/5 rounded-xl text-center">
            <p className="text-white font-semibold">${currentFee ?? `${minFeeFormatted} (min)`}</p>
            <p className="text-white/30 text-xs mt-0.5">Current fee</p>
          </div>
          <div className="flex-1 p-3 bg-white/5 rounded-xl text-center">
            <p className="text-blue-400 font-semibold">70%</p>
            <p className="text-white/30 text-xs mt-0.5">To your treasury</p>
          </div>
          <div className="flex-1 p-3 bg-white/5 rounded-xl text-center">
            <p className="text-white/50 font-semibold">30%</p>
            <p className="text-white/30 text-xs mt-0.5">To protocol</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-white/60 mb-1 block">New Fee (USDC)</label>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-all">
            <input
              type="number"
              placeholder={`0 = protocol min ($${minFeeFormatted})`}
              value={fee}
              onChange={e => setFee(e.target.value)}
              className="flex-1 bg-transparent py-3 pl-4 text-white text-sm outline-none placeholder:text-white/20"
            />
            <span className="px-4 text-white/30 text-sm">USDC</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Update Claim Fee'}
        </button>
        {isSuccess && <p className="text-green-400 text-sm text-center">✓ Claim fee updated</p>}
      </div>
    </div>
  )
}
