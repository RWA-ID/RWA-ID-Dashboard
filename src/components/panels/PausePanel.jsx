import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function PausePanel({ projectId, project, onRefresh }) {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) onRefresh()

  const handleToggle = () => {
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: project.active ? 'pauseProject' : 'unpauseProject',
      args: [BigInt(projectId)],
    })
  }

  return (
    <div>
      <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">
        {project.active ? 'Pause Project' : 'Unpause Project'}
      </h3>
      <p className="text-white/40 text-sm mb-6">
        {project.active
          ? 'Pausing will prevent any new identity claims until you unpause.'
          : 'Unpausing will allow users to claim identities again.'}
      </p>

      <div className={`p-4 rounded-xl border mb-6 ${
        project.active
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-red-500/5 border-red-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.active ? '✅' : '⏸️'}</span>
          <div>
            <p className="text-white font-semibold">Project is {project.active ? 'Active' : 'Paused'}</p>
            <p className={`text-sm ${project.active ? 'text-green-400' : 'text-red-400'}`}>
              {project.active ? 'Claims are currently open.' : 'Claims are currently disabled.'}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isPending || isConfirming}
        className={`w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-40 ${
          project.active
            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
        }`}
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : project.active ? '⏸️ Pause Project' : '▶️ Unpause Project'}
      </button>
      {isSuccess && <p className="text-green-400 text-sm mt-3 text-center">✓ Done</p>}
    </div>
  )
}
