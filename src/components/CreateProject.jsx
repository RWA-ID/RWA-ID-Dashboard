import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, isAddress } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../lib/contracts'

function slugValid(slug) {
  return /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(slug) || /^[a-z0-9]{3,32}$/.test(slug)
}

export default function CreateProject({ address, onBack, onSuccess }) {
  const [slug, setSlug] = useState('')
  const [treasury, setTreasury] = useState(address || '')
  const [fee, setFee] = useState('')
  const [transferable, setTransferable] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) {
    setTimeout(onSuccess, 1500)
  }

  const normalizedSlug = slug.toLowerCase()
  const isSlugValid = slugValid(normalizedSlug)
  const isTreasuryValid = isAddress(treasury)
  const canSubmit = isSlugValid && isTreasuryValid && confirmed && !isPending && !isConfirming

  const handleCreate = () => {
    const claimFee = fee ? parseUnits(fee, 6) : 0n
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'createProject',
      args: [normalizedSlug, treasury, claimFee, transferable],
    })
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-6"
      >
        ← Back to projects
      </button>

      <div className="mb-8">
        <h1 className="font-['Syne'] text-2xl font-800 text-white mb-1">Create New Project</h1>
        <p className="text-white/40 text-sm">
          Register a new namespace under <span className="text-blue-400">*.rwa-id.eth</span>. Free — no ETH required.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">

        {/* Slug */}
        <div>
          <label className="text-sm text-white/60 mb-1 block">
            Project Slug <span className="text-white/30">(3–32 chars, lowercase letters, numbers, hyphens)</span>
          </label>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-all">
            <input
              type="text"
              placeholder="my-project"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase())}
              className="flex-1 bg-transparent py-3 pl-4 text-white text-sm outline-none placeholder:text-white/20"
            />
            <span className="px-4 text-white/30 text-sm">.rwa-id.eth</span>
          </div>
          {slug && !isSlugValid && (
            <p className="text-red-400 text-xs mt-1">
              3–32 chars, only a-z, 0-9, and hyphens (not at start or end)
            </p>
          )}
          {isSlugValid && (
            <p className="text-blue-400 text-xs mt-1">
              ✓ Will register as <strong>{normalizedSlug}.rwa-id.eth</strong>
            </p>
          )}
        </div>

        {/* Treasury */}
        <div>
          <label className="text-sm text-white/60 mb-1 block">
            Treasury Address <span className="text-white/30">(receives 70% of claim fees)</span>
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={treasury}
            onChange={e => setTreasury(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
          />
          {treasury && !isTreasuryValid && (
            <p className="text-red-400 text-xs mt-1">Enter a valid Ethereum address</p>
          )}
        </div>

        {/* Claim Fee */}
        <div>
          <label className="text-sm text-white/60 mb-1 block">
            Claim Fee (USDC) <span className="text-white/30">— leave blank to use protocol minimum ($0.50)</span>
          </label>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-all">
            <input
              type="number"
              placeholder="0.50"
              value={fee}
              onChange={e => setFee(e.target.value)}
              className="flex-1 bg-transparent py-3 pl-4 text-white text-sm outline-none placeholder:text-white/20"
            />
            <span className="px-4 text-white/30 text-sm">USDC</span>
          </div>
          {fee && parseFloat(fee) > 0 && (
            <p className="text-white/30 text-xs mt-1">
              Treasury receives ${(parseFloat(fee) * 0.7).toFixed(2)} · Protocol receives ${(parseFloat(fee) * 0.3).toFixed(2)}
            </p>
          )}
        </div>

        {/* Transferability */}
        <div>
          <label className="text-sm text-white/60 mb-2 block">
            Token Transferability <span className="text-white/30">(default for all minted tokens)</span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setTransferable(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                !transferable
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              🔒 Soulbound <span className="text-xs font-normal block text-white/40 mt-0.5">Non-transferable</span>
            </button>
            <button
              onClick={() => setTransferable(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                transferable
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              ↔️ Transferable <span className="text-xs font-normal block text-white/40 mt-0.5">Can be sold/sent</span>
            </button>
          </div>
        </div>

        {/* Summary */}
        {isSlugValid && isTreasuryValid && (
          <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl space-y-2 text-sm">
            <p className="text-white/60 font-semibold text-xs uppercase tracking-wider mb-2">Summary</p>
            <div className="flex justify-between"><span className="text-white/40">Namespace</span><span className="text-blue-400 font-mono">{normalizedSlug}.rwa-id.eth</span></div>
            <div className="flex justify-between"><span className="text-white/40">Treasury</span><span className="text-white/70 font-mono">{treasury.slice(0,6)}...{treasury.slice(-4)}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Claim Fee</span><span className="text-white/70">{fee ? `$${fee} USDC` : 'Protocol min ($0.50)'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Token type</span><span className="text-white/70">{transferable ? 'Transferable' : 'Soulbound'}</span></div>
          </div>
        )}

        {/* Confirm checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-blue-500"
          />
          <span className="text-sm text-white/50">
            I confirm the slug <strong className="text-white">{normalizedSlug || '...'}</strong> is correct.
            Slugs cannot be changed after creation.
          </span>
        </label>

        <button
          onClick={handleCreate}
          disabled={!canSubmit}
          className="w-full py-4 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all text-base"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Creating project...' : 'Create Project'}
        </button>

        {isSuccess && (
          <p className="text-green-400 text-sm text-center">
            ✓ Project created! Returning to project list...
          </p>
        )}
      </div>
    </div>
  )
}
