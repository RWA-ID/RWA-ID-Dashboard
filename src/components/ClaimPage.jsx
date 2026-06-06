import { useState, useEffect } from 'react'
import { useAccount, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { modal } from '../lib/wagmi'
import { RWAID_ADDRESS, RWAID_ABI, USDC_ADDRESS, USDC_ABI } from '../lib/contracts'

function FingerprintSVG({ size = 24, color = '#3d7fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13.5" r="1" fill={color} />
      <path d="M10 14.5 C10 11 14 11 14 14.5" stroke={color} strokeWidth="1.3" />
      <path d="M10 14.5 Q12 17 14 14.5" stroke={color} strokeWidth="1.3" />
      <path d="M8 16 C8 8 16 8 16 16" stroke={color} strokeWidth="1.2" />
      <path d="M8 16 Q12 19.5 16 16" stroke={color} strokeWidth="1.2" />
      <path d="M6 17.5 C6 5 18 5 18 17.5" stroke={color} strokeWidth="1.1" />
      <path d="M6 17.5 Q12 21.5 18 17.5" stroke={color} strokeWidth="1.1" />
      <path d="M4 19.5 C4 2 20 2 20 19.5" stroke={color} strokeWidth="1" opacity="0.8" />
      <path d="M4 19.5 Q12 23.5 20 19.5" stroke={color} strokeWidth="1" opacity="0.8" />
      <path d="M2.5 21.5 C2.5 0 21.5 0 21.5 21.5" stroke={color} strokeWidth="0.9" opacity="0.5" />
    </svg>
  )
}

const PROJECT_FIELDS = ['owner', 'slug', 'slugHash', 'treasury', 'claimFee', 'transferable', 'merkleRoot', 'active', 'totalClaimed', 'totalRevenue']

function parseProject(result) {
  if (!result) return null
  const arr = Array.isArray(result) ? result : Object.values(result)
  return Object.fromEntries(PROJECT_FIELDS.map((k, i) => [k, arr[i]]))
}

export default function ClaimPage({ projectId, cid }) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const pid = BigInt(projectId)

  const handleDisconnect = async () => {
    try { await modal.disconnect() } catch {}
    try { disconnect() } catch {}
  }

  // ── IPFS data ──────────────────────────────────────────────────────────────
  const [ipfsData, setIpfsData] = useState(null)
  const [ipfsLoading, setIpfsLoading] = useState(true)
  const [ipfsError, setIpfsError] = useState('')

  useEffect(() => {
    setIpfsLoading(true)
    setIpfsError('')
    const gateways = [
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
    ]
    const tryNext = (i) => {
      if (i >= gateways.length) { setIpfsError('Could not load proof data from IPFS.'); setIpfsLoading(false); return }
      fetch(gateways[i])
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then(data => { setIpfsData(data); setIpfsLoading(false) })
        .catch(() => tryNext(i + 1))
    }
    tryNext(0)
  }, [cid])

  // User's entry in the allowlist
  const userEntry = isConnected && ipfsData
    ? ipfsData.entries?.find(e => e.wallet?.toLowerCase() === address?.toLowerCase())
    : null

  // ── On-chain reads ─────────────────────────────────────────────────────────
  const { data: projectRaw } = useReadContract({
    address: RWAID_ADDRESS, abi: RWAID_ABI,
    functionName: 'projects', args: [pid],
  })
  const project = parseProject(projectRaw)

  const { data: hasClaimed, refetch: refetchClaimed } = useReadContract({
    address: RWAID_ADDRESS, abi: RWAID_ABI,
    functionName: 'claimed', args: [pid, address],
    query: { enabled: !!address },
  })

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_ABI,
    functionName: 'allowance', args: [address, RWAID_ADDRESS],
    query: { enabled: !!address },
  })

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_ABI,
    functionName: 'balanceOf', args: [address],
    query: { enabled: !!address },
  })

  const fee = project ? (project.claimFee > 0n ? project.claimFee : 500000n) : 500000n
  const hasAllowance = usdcAllowance !== undefined && usdcAllowance >= fee
  const hasFunds = usdcBalance !== undefined && usdcBalance >= fee

  // ── Approve USDC ───────────────────────────────────────────────────────────
  const { writeContract: writeApprove, data: approveHash, isPending: approvePending } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  useEffect(() => {
    if (approveSuccess) refetchAllowance()
  }, [approveSuccess])

  // ── Claim ──────────────────────────────────────────────────────────────────
  const { writeContract: writeClaim, data: claimHash, isPending: claimPending } = useWriteContract()
  const { isLoading: claimConfirming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({ hash: claimHash })

  useEffect(() => {
    if (claimSuccess) refetchClaimed()
  }, [claimSuccess])

  const handleApprove = () => {
    writeApprove({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'approve', args: [RWAID_ADDRESS, fee] })
  }

  const handleClaim = () => {
    if (!userEntry) return
    writeClaim({
      address: RWAID_ADDRESS, abi: RWAID_ABI,
      functionName: 'claim',
      args: [pid, userEntry.nameHash, userEntry.proof],
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const isLoading = ipfsLoading || !project

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col">

      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FingerprintSVG size={22} />
          </div>
          <span className="font-['Syne'] font-800 text-lg text-white tracking-tight">
            RWA-ID <span className="text-[#3d7fff]">Claim</span>
          </span>
        </div>
        {!isConnected ? (
          <button
            onClick={() => modal.open()}
            className="px-5 py-2 bg-[#3d7fff] hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40 font-mono hidden sm:block">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm border border-white/10 rounded-lg text-white/50 hover:border-white/20 hover:text-white transition-all"
            >
              Disconnect
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Project name */}
          {project && (
            <p className="text-center text-white/30 text-sm font-mono mb-6">
              {project.slug}.rwa-id.eth
            </p>
          )}

          {/* Main card */}
          <div className="relative bg-[#0f1924] border border-white/8 rounded-2xl overflow-hidden">
            {/* Squares background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                backgroundSize: '28px 28px',
              }}
            />

            <div className="relative z-10 p-8 flex flex-col items-center text-center gap-6">

              {/* Loading */}
              {isLoading && (
                <>
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FingerprintSVG size={44} color="#3d7fff" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/40 text-sm">Checking eligibility...</p>
                  </div>
                </>
              )}

              {/* IPFS error */}
              {!ipfsLoading && ipfsError && (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <FingerprintSVG size={44} color="#f87171" />
                  </div>
                  <p className="text-red-400 text-sm">{ipfsError}</p>
                </>
              )}

              {/* Connect wallet prompt */}
              {!isLoading && !ipfsError && !isConnected && (
                <>
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FingerprintSVG size={44} color="#3d7fff" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg mb-1">Claim your RWA Identity</p>
                    <p className="text-white/40 text-sm leading-relaxed">
                      Connect your wallet to check if you are eligible to claim an identity under{' '}
                      <span className="text-blue-400 font-mono">{project?.slug}.rwa-id.eth</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => modal.open()}
                    className="w-full py-3.5 bg-[#3d7fff] hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    Connect Wallet
                  </button>
                </>
              )}

              {/* Already claimed */}
              {!isLoading && !ipfsError && isConnected && hasClaimed && (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <FingerprintSVG size={44} color="#4ade80" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-3">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Identity Claimed
                    </div>
                    <p className="text-white font-semibold text-lg font-mono">
                      {userEntry?.name}.{project?.slug}.rwa-id.eth
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      This identity has already been claimed to your wallet.
                    </p>
                  </div>
                </>
              )}

              {/* Claim success */}
              {!isLoading && !ipfsError && isConnected && claimSuccess && !hasClaimed && (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <FingerprintSVG size={44} color="#4ade80" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-3">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Claimed Successfully
                    </div>
                    <p className="text-white font-semibold text-lg font-mono">
                      {userEntry?.name}.{project?.slug}.rwa-id.eth
                    </p>
                    <p className="text-white/40 text-sm mt-2">Your on-chain identity is now active.</p>
                  </div>
                </>
              )}

              {/* Not eligible */}
              {!isLoading && !ipfsError && isConnected && !hasClaimed && !claimSuccess && !userEntry && ipfsData && (
                <>
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <FingerprintSVG size={44} color="#4b5563" />
                  </div>
                  <div>
                    <p className="text-white/60 font-semibold text-lg mb-1">Not eligible</p>
                    <p className="text-white/30 text-sm leading-relaxed">
                      The connected wallet{' '}
                      <span className="font-mono text-white/50">{address?.slice(0, 6)}...{address?.slice(-4)}</span>{' '}
                      is not on the allowlist for this project.
                    </p>
                  </div>
                </>
              )}

              {/* Eligible — show claim flow */}
              {!isLoading && !ipfsError && isConnected && !hasClaimed && !claimSuccess && userEntry && (
                <>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <FingerprintSVG size={44} color="#3d7fff" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-3">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Eligible
                    </div>
                    <p className="text-white/50 text-xs mb-1">Your identity</p>
                    <p className="text-white font-semibold text-xl font-mono">
                      {userEntry.name}<span className="text-white/30">.{project?.slug}.rwa-id.eth</span>
                    </p>
                  </div>

                  {/* Fee info */}
                  <div className="w-full p-3 bg-white/5 border border-white/8 rounded-xl flex items-center justify-between text-sm">
                    <span className="text-white/40">Claim fee</span>
                    <span className={`font-semibold ${hasFunds ? 'text-white' : 'text-red-400'}`}>
                      ${formatUnits(fee, 6)} USDC
                      {!hasFunds && <span className="text-red-400 text-xs ml-2">(insufficient balance)</span>}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {!hasFunds ? (
                    <p className="text-red-400 text-sm">
                      You need at least ${formatUnits(fee, 6)} USDC to claim this identity.
                    </p>
                  ) : !hasAllowance ? (
                    <div className="w-full space-y-4">
                      {/* Step indicator */}
                      <div className="w-full p-3 bg-white/3 border border-white/8 rounded-xl">
                        <p className="text-white/40 text-xs mb-3 text-center">2 wallet signatures required to claim</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">1</div>
                            <span className="text-blue-300 text-[10px] font-medium">Approve USDC</span>
                            <span className="text-white/25 text-[9px]">Allow spending</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/20 flex-shrink-0"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <div className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-white/3 border border-white/8 rounded-lg opacity-40">
                            <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/50 font-bold text-xs">2</div>
                            <span className="text-white/40 text-[10px] font-medium">Claim Identity</span>
                            <span className="text-white/25 text-[9px]">Mint your token</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleApprove}
                        disabled={approvePending || approveConfirming}
                        className="w-full py-3.5 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
                      >
                        {approvePending ? 'Confirm in wallet...' : approveConfirming ? 'Approving...' : `Step 1 of 2 — Approve $${formatUnits(fee, 6)} USDC`}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      {/* Step indicator — step 1 done */}
                      <div className="w-full p-3 bg-white/3 border border-white/8 rounded-xl">
                        <p className="text-white/40 text-xs mb-3 text-center">Step 1 complete — one more signature to go</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span className="text-green-400 text-[10px] font-medium">USDC Approved</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/20 flex-shrink-0"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <div className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">2</div>
                            <span className="text-blue-300 text-[10px] font-medium">Claim Identity</span>
                            <span className="text-white/25 text-[9px]">Mint your token</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleClaim}
                        disabled={claimPending || claimConfirming}
                        className="w-full py-3.5 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                      >
                        {claimPending ? 'Confirm in wallet...' : claimConfirming ? 'Claiming...' : `Step 2 of 2 — Claim ${userEntry.name}.${project?.slug}.rwa-id.eth`}
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

          <p className="text-center text-white/15 text-xs mt-6">
            Powered by <span className="text-white/30">RWA-ID Protocol</span>
          </p>
        </div>
      </main>
    </div>
  )
}
