import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import NameLookup from './NameLookup'

export default function TransferabilityPanel({ projectId, project, onRefresh }) {
  const [tokenId, setTokenId] = useState('')
  const [tokenTransferable, setTokenTransferable] = useState(true)

  const {
    writeContract: writeProject, data: projectHash, isPending: projectPending,
  } = useWriteContract()
  const {
    writeContract: writeToken, data: tokenHash, isPending: tokenPending,
  } = useWriteContract()

  const { isLoading: projectConfirming, isSuccess: projectSuccess } = useWaitForTransactionReceipt({ hash: projectHash })
  const { isLoading: tokenConfirming, isSuccess: tokenSuccess } = useWaitForTransactionReceipt({ hash: tokenHash })

  if (projectSuccess || tokenSuccess) onRefresh()

  const handleProjectTransfer = (val) => {
    writeProject({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'setProjectTransferable',
      args: [BigInt(projectId), val],
    })
  }

  const handleTokenTransfer = () => {
    writeToken({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'setTokenTransferable',
      args: [BigInt(tokenId), tokenTransferable],
    })
  }

  return (
    <div className="space-y-8">
      {/* Project-level transferability */}
      <div>
        <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">Project Default</h3>
        <p className="text-white/40 text-sm mb-4">
          Sets the default transferability for all <em>new</em> tokens minted in this project.
          Existing tokens are unaffected.
        </p>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
          <div>
            <p className="text-white text-sm font-semibold">Currently</p>
            <p className={`text-sm font-semibold ${project.transferable ? 'text-sky-400' : 'text-white/40'}`}>
              {project.transferable ? 'Transferable' : 'Soulbound (non-transferable)'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleProjectTransfer(false)}
            disabled={!project.transferable || projectPending || projectConfirming}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl border border-white/10 transition-all text-sm"
          >
            {projectPending ? 'Confirm...' : projectConfirming ? 'Confirming...' : '🔒 Make Soulbound'}
          </button>
          <button
            onClick={() => handleProjectTransfer(true)}
            disabled={project.transferable || projectPending || projectConfirming}
            className="flex-1 py-3 bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-sky-400 font-semibold rounded-xl border border-sky-500/20 transition-all text-sm"
          >
            {projectPending ? 'Confirm...' : projectConfirming ? 'Confirming...' : '↔️ Make Transferable'}
          </button>
        </div>
        {projectSuccess && <p className="text-green-400 text-sm mt-3 text-center">✓ Project transferability updated</p>}
      </div>

      <div className="border-t border-white/10" />

      {/* Token-level override */}
      <div>
        <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">Override Specific Token</h3>
        <p className="text-white/40 text-sm mb-5">
          Override transferability on a specific already-minted token. Click a claimed identity below to pre-fill, or enter a token ID manually.
        </p>

        {/* Name lookup */}
        <NameLookup projectId={projectId} projectSlug={project.slug} onSelect={id => setTokenId(id)} />

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1 block">Token ID</label>
            <input
              type="number"
              placeholder="e.g. 42"
              value={tokenId}
              onChange={e => setTokenId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Set to</label>
            <div className="flex gap-3">
              <button
                onClick={() => setTokenTransferable(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  !tokenTransferable
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                🔒 Soulbound
              </button>
              <button
                onClick={() => setTokenTransferable(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  tokenTransferable
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                ↔️ Transferable
              </button>
            </div>
          </div>

          <button
            onClick={handleTokenTransfer}
            disabled={!tokenId || tokenPending || tokenConfirming}
            className="w-full py-3 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
          >
            {tokenPending ? 'Confirm in wallet...' : tokenConfirming ? 'Confirming...' : 'Update Token'}
          </button>
          {tokenSuccess && <p className="text-green-400 text-sm text-center">✓ Token transferability updated</p>}
        </div>
      </div>
    </div>
  )
}
