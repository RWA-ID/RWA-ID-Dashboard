import { useEffect, useState } from 'react'
import { useAccount, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { modal } from '../lib/wagmi'
import { RWAID_ADDRESS, RWAID_ABI, USDC_ADDRESS, USDC_ABI } from '../lib/contracts'
import { parseProject } from '../lib/useProjects'
import { effectiveFee, errorText, shortAddress, usd } from '../lib/format'
import { Check, Close, Warning } from './icons'

const GATEWAYS = [
  cid => `https://ipfs.io/ipfs/${cid}`,
  cid => `https://dweb.link/ipfs/${cid}`,
  cid => `https://gateway.pinata.cloud/ipfs/${cid}`,
]

function Shell({ slug, children, onDisconnect, address }) {
  return (
    <div className="claim-page">
      <div className="claim-bar">
        <span className="brand-mark" style={{ width: 20, height: 20, borderRadius: 5, fontSize: 10 }}>R</span>
        <span style={{ font: '500 13px/1 var(--f-sans)' }}>RWA·ID</span>
        {slug && <span className="mono" style={{ fontSize: 12, color: 'rgba(244,244,242,.4)' }}>{slug}.rwa-id.eth</span>}
        {address && (
          <button className="claim-bar-btn" onClick={onDisconnect}>
            {shortAddress(address)} · Disconnect
          </button>
        )}
      </div>
      <div className="claim-body">
        <div style={{ width: '100%', maxWidth: 540 }}>{children}</div>
      </div>
    </div>
  )
}

function StateCard({ tone = 'neutral', icon, title, children }) {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: 'center', padding: '36px 26px' }}>
        <span className={`claim-mark ${tone}`}>{icon}</span>
        <div style={{ font: '600 17px/1.3 var(--f-sans)', letterSpacing: '-.015em', margin: '16px 0 8px' }}>
          {title}
        </div>
        <div className="body" style={{ maxWidth: 400, margin: '0 auto' }}>{children}</div>
      </div>
    </div>
  )
}

export default function ClaimPage({ projectId, cid }) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const pid = BigInt(projectId)

  const [proofs, setProofs] = useState(null)
  const [ipfsError, setIpfsError] = useState('')
  const [ipfsLoading, setIpfsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIpfsLoading(true)
    setIpfsError('')
    ;(async () => {
      for (const gw of GATEWAYS) {
        try {
          const res = await fetch(gw(cid))
          if (!res.ok) continue
          const data = await res.json()
          if (!cancelled) { setProofs(data); setIpfsLoading(false) }
          return
        } catch { /* try the next gateway */ }
      }
      if (!cancelled) {
        setIpfsError('Could not load the proof set from IPFS. Check the link, or try again in a moment.')
        setIpfsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [cid])

  const { data: projectRaw } = useReadContract({
    address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'projects', args: [pid],
  })
  const project = parseProject(projectRaw)

  const { data: minFee } = useReadContract({
    address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'minimumClaimFee',
  })

  const { data: hasClaimed, refetch: refetchClaimed } = useReadContract({
    address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'claimed', args: [pid, address],
    query: { enabled: !!address },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'allowance', args: [address, RWAID_ADDRESS],
    query: { enabled: !!address },
  })

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'balanceOf', args: [address],
    query: { enabled: !!address },
  })

  const fee = effectiveFee(project, minFee)
  const entry = isConnected && proofs
    ? proofs.entries?.find(e => (e.wallet || e.address)?.toLowerCase() === address?.toLowerCase())
    : null

  const approved = allowance !== undefined && allowance >= fee
  const funded   = balance !== undefined && balance >= fee

  const { writeContract: writeApprove, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveDone } = useWaitForTransactionReceipt({ hash: approveHash })

  const { writeContract: writeClaim, data: claimHash, isPending: claimPending, error: claimError } = useWriteContract()
  const { isLoading: claimConfirming, isSuccess: claimDone } = useWaitForTransactionReceipt({ hash: claimHash })

  useEffect(() => { if (approveDone) refetchAllowance() }, [approveDone, refetchAllowance])
  useEffect(() => { if (claimDone) refetchClaimed() }, [claimDone, refetchClaimed])

  const handleDisconnect = async () => {
    try { await modal.disconnect() } catch { /* already closed */ }
    try { disconnect() } catch { /* already gone */ }
  }

  const slug = project?.slug
  const shell = (children) => (
    <Shell slug={slug} address={isConnected ? address : null} onDisconnect={handleDisconnect}>
      {children}
    </Shell>
  )

  /* ── Loading ── */
  if (ipfsLoading || !project) {
    return shell(
      <StateCard icon={<span className="spinner lg" />} title="Checking your eligibility">
        Reading the allowlist from IPFS and the registry from Ethereum mainnet.
      </StateCard>,
    )
  }

  /* ── Broken link ── */
  if (ipfsError) {
    return shell(
      <StateCard tone="danger" icon={<Warning size={24} />} title="Proof set unavailable">
        {ipfsError}
      </StateCard>,
    )
  }

  const header = (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div className="mono-label" style={{ marginBottom: 14 }}>{slug}</div>
      <h1 style={{ font: '600 38px/1.08 var(--f-sans)', letterSpacing: '-.03em', marginBottom: 10 }}>
        Claim your identity
      </h1>
      <p style={{ font: '400 14.5px/1.55 var(--f-sans)', color: 'var(--mute-2)', textWrap: 'pretty' }}>
        You were allowlisted by {slug}. Claiming mints
        {project.transferable ? ' an' : ' a soulbound'} identity to the wallet you connect
        {project.transferable ? '.' : ' — it cannot be transferred or sold.'}
      </p>
    </div>
  )

  /* ── Not connected ── */
  if (!isConnected) {
    return shell(
      <>
        {header}
        <StateCard tone="accent" icon={<Check size={22} />} title="Connect your wallet">
          <p style={{ marginBottom: 20 }}>
            Connect the wallet {slug} allowlisted to check whether you can claim a name under{' '}
            <span className="code-inline">{slug}.rwa-id.eth</span>.
          </p>
          <button className="btn btn-ink btn-full" onClick={() => modal.open()}>Connect wallet</button>
        </StateCard>
      </>,
    )
  }

  /* ── Already claimed ── */
  if (hasClaimed || claimDone) {
    return shell(
      <>
        {header}
        <StateCard tone="good" icon={<Check size={24} />} title="Identity claimed">
          <p className="claim-name" style={{ margin: '0 0 10px' }}>
            {entry?.name}<span style={{ color: 'var(--mute-3)' }}>.{slug}.rwa-id.eth</span>
          </p>
          <p>
            This identity is live on Ethereum mainnet and resolves on every supported chain. It belongs to{' '}
            {shortAddress(address)}.
          </p>
        </StateCard>
      </>,
    )
  }

  /* ── Not on the allowlist ── */
  if (!entry) {
    return shell(
      <>
        {header}
        <StateCard tone="neutral" icon={<Close size={22} width={2} />} title="Not on this allowlist">
          The wallet {shortAddress(address)} is not in the proof set for {slug}. If you expected to be
          included, ask {slug} to add you and re-publish the allowlist.
        </StateCard>
      </>,
    )
  }

  /* ── Paused ── */
  if (!project.active) {
    return shell(
      <>
        {header}
        <StateCard tone="warn" icon={<Warning size={22} />} title="Claiming is paused">
          {slug} has paused new claims for this namespace. Your allowlist entry is unaffected — you can
          claim <span className="code-inline">{entry.name}.{slug}.rwa-id.eth</span> once claiming resumes.
        </StateCard>
      </>,
    )
  }

  const busy = approvePending || approveConfirming || claimPending || claimConfirming
  const error = approveError || claimError

  return shell(
    <>
      {header}
      <div className="card">
        <div className="card-body" style={{ padding: '22px 22px 20px', borderBottom: '1px solid var(--hairline-faint)' }}>
          <div className="mono-label" style={{ marginBottom: 12 }}>Your name</div>
          <div className="input-shell readonly">
            <input value={entry.name} readOnly style={{ fontSize: 15 }} />
            <span className="affix">.{slug}.rwa-id.eth</span>
          </div>
          <div className="row row-wrap" style={{ gap: 9, marginTop: 12 }}>
            <span className="pill pill-good"><span className="dot" />Eligible — proof found</span>
            <span className="mono-note">verified against the onchain root</span>
          </div>
        </div>

        <div className="stat-strip" style={{ '--cols': 2, border: 0, borderRadius: 0, boxShadow: 'none' }}>
          <div className="stat" style={{ padding: '18px 22px', borderBottom: '1px solid var(--hairline-faint)' }}>
            <div className="stat-label" style={{ marginBottom: 8 }}>Claim fee</div>
            <div className="stat-value" style={{ fontSize: 21 }}>{usd(fee)}</div>
            <div className="stat-meta">USDC · one time</div>
          </div>
          <div className="stat" style={{ padding: '18px 22px', borderBottom: '1px solid var(--hairline-faint)', borderRight: 0 }}>
            <div className="stat-label" style={{ marginBottom: 8 }}>Token policy</div>
            <div className="stat-value" style={{ fontSize: 21 }}>{project.transferable ? 'Transferable' : 'Soulbound'}</div>
            <div className="stat-meta">{project.transferable ? 'standard ERC-721' : 'bound to your wallet'}</div>
          </div>
        </div>

        <div className="card-body card-stack" style={{ gap: 14 }}>
          <div className="kv-row" style={{ padding: '11px 14px', border: '1px solid var(--hairline-faint)', borderRadius: 9, background: 'var(--surface-2)' }}>
            <span className="kv-key">Minting to</span>
            <span className="kv-val">{shortAddress(address)}</span>
          </div>

          {!funded ? (
            <div className="notice notice-danger">
              <Warning size={14} />
              <span>
                This wallet holds {balance !== undefined ? usd(balance) : '—'} USDC — you need {usd(fee)} to
                claim. Top up and refresh this page.
              </span>
            </div>
          ) : (
            <>
              <div className="claim-steps">
                <div className={`claim-step${approved ? ' is-done' : ' is-current'}`}>
                  <span className="claim-step-num">{approved ? <Check size={12} width={2.4} /> : '1'}</span>
                  <span>Approve {usd(fee)} USDC</span>
                </div>
                <div className={`claim-step${approved ? ' is-current' : ''}`}>
                  <span className="claim-step-num">2</span>
                  <span>Claim your identity</span>
                </div>
              </div>

              {!approved ? (
                <button
                  className="btn btn-ink btn-full"
                  disabled={busy}
                  onClick={() => writeApprove({
                    address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'approve',
                    args: [RWAID_ADDRESS, fee],
                  })}
                >
                  {approvePending ? 'Confirm in your wallet…'
                    : approveConfirming ? 'Approving…'
                    : `Step 1 of 2 — approve ${usd(fee)} USDC`}
                </button>
              ) : (
                <button
                  className="btn btn-ink btn-full"
                  disabled={busy}
                  onClick={() => writeClaim({
                    address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'claim',
                    // v3 hashes the label onchain, so the token can be named.
                    args: [pid, entry.name, entry.proof],
                  })}
                >
                  {claimPending ? 'Confirm in your wallet…'
                    : claimConfirming ? 'Minting your identity…'
                    : `Step 2 of 2 — claim ${entry.name}.${slug}.rwa-id.eth`}
                </button>
              )}
            </>
          )}

          {error && (
            <div className="notice notice-danger">
              <Warning size={14} /><span>{errorText(error)}</span>
            </div>
          )}

          <p className="mono-note" style={{ textAlign: 'center', textWrap: 'pretty' }}>
            {slug} receives 70% of the fee. RWA-ID never takes custody of your assets or personal data.
          </p>
        </div>
      </div>
    </>,
  )
}
