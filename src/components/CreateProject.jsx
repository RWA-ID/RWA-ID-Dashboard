import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, isAddress } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../lib/contracts'

function slugValid(slug) {
  return /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(slug) || /^[a-z0-9]{3,32}$/.test(slug)
}

export default function CreateProject({ address, onBack, onSuccess }) {
  const [slug, setSlug]             = useState('')
  const [treasury, setTreasury]     = useState(address || '')
  const [fee, setFee]               = useState('')
  const [transferable, setTransferable] = useState(false)
  const [confirmed, setConfirmed]   = useState(false)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess }   = useWaitForTransactionReceipt({ hash })

  if (isSuccess) setTimeout(onSuccess, 1500)

  const normalizedSlug  = slug.toLowerCase()
  const isSlugValid     = slugValid(normalizedSlug)
  const isTreasuryValid = isAddress(treasury)
  const canSubmit       = isSlugValid && isTreasuryValid && confirmed && !isPending && !isConfirming

  const handleCreate = () => {
    const claimFee = fee ? parseUnits(fee, 6) : 0n
    writeContract({
      address: RWAID_ADDRESS, abi: RWAID_ABI,
      functionName: 'createProject',
      args: [normalizedSlug, treasury, claimFee, transferable],
    })
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: 'var(--ink-3)', fontSize: 13, marginBottom: 28,
        cursor: 'pointer', border: 0, background: 'none', padding: 0, fontFamily: 'var(--f-sans)',
        transition: 'color .15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>
        Back to projects
      </button>

      {/* Page header */}
      <div style={{
        paddingBottom: 24, borderBottom: '1px solid var(--line)', marginBottom: 28,
      }}>
        <h1 style={{
          fontFamily: 'var(--f-display)', fontWeight: 600,
          fontSize: 36, letterSpacing: '-.02em', lineHeight: 1.05,
          margin: '0 0 6px', color: 'var(--ink)',
        }}>
          New project
        </h1>
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
          Register a namespace under <code style={{ color: 'var(--ink-2)' }}>*.rwa-id.eth</code> — free, no ETH required.
        </p>
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Slug */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">
                Project slug
                <span style={{ color: 'var(--ink-4)', fontWeight: 400, marginLeft: 6 }}>3–32 chars · a-z, 0-9, hyphens</span>
              </label>
              <div className="d-input">
                <input
                  type="text"
                  placeholder="my-project"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase())}
                />
                <span className="suffix">.rwa-id.eth</span>
              </div>
              {slug && !isSlugValid && (
                <span style={{ color: 'var(--bad)', fontSize: 12 }}>
                  3–32 chars, only a-z 0-9 and hyphens (not at start or end)
                </span>
              )}
              {isSlugValid && (
                <span style={{ color: 'var(--good)', fontSize: 12 }}>
                  ✓ Will register as <strong>{normalizedSlug}.rwa-id.eth</strong>
                </span>
              )}
            </div>

            {/* Treasury */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">
                Treasury address
                <span style={{ color: 'var(--ink-4)', fontWeight: 400, marginLeft: 6 }}>receives 70% of claim fees</span>
              </label>
              <div className="d-input mono">
                <input
                  type="text"
                  placeholder="0x…"
                  value={treasury}
                  onChange={e => setTreasury(e.target.value)}
                />
              </div>
              {treasury && !isTreasuryValid && (
                <span style={{ color: 'var(--bad)', fontSize: 12 }}>Enter a valid Ethereum address</span>
              )}
            </div>

            {/* Claim Fee */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">
                Claim fee (USDC)
                <span style={{ color: 'var(--ink-4)', fontWeight: 400, marginLeft: 6 }}>leave blank for protocol minimum ($0.50)</span>
              </label>
              <div className="d-input mono">
                <input
                  type="number"
                  placeholder="0.50"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                />
                <span className="suffix">USDC</span>
              </div>
              {fee && parseFloat(fee) > 0 && (
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11.5, color: 'var(--ink-4)' }}>
                  Treasury receives ${(parseFloat(fee) * 0.7).toFixed(2)} · Protocol receives ${(parseFloat(fee) * 0.3).toFixed(2)}
                </span>
              )}
            </div>

            {/* Transferability */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Token transferability</label>
              <div className="radio-group">
                <button className={`radio-card${!transferable ? ' is-active' : ''}`} onClick={() => setTransferable(false)}>
                  <div className="radio-card-head">
                    <span className="radio-dot"/>
                    <span className="radio-card-title">Soulbound</span>
                  </div>
                  <div className="radio-card-desc">Non-transferable — recommended for KYC-bound identities.</div>
                </button>
                <button className={`radio-card${transferable ? ' is-active' : ''}`} onClick={() => setTransferable(true)}>
                  <div className="radio-card-head">
                    <span className="radio-dot"/>
                    <span className="radio-card-title">Transferable</span>
                  </div>
                  <div className="radio-card-desc">Standard ERC-721 — tokens can be sold or sent.</div>
                </button>
              </div>
            </div>

            {/* Summary */}
            {isSlugValid && isTreasuryValid && (
              <div style={{
                padding: '14px 16px', border: '1px solid var(--accent-line)',
                borderRadius: 'var(--radius)', background: 'var(--accent-soft)',
              }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 10 }}>
                  Summary
                </div>
                {[
                  ['Namespace',  `${normalizedSlug}.rwa-id.eth`],
                  ['Treasury',   `${treasury.slice(0,6)}…${treasury.slice(-4)}`],
                  ['Claim Fee',  fee ? `$${fee} USDC` : 'Protocol min ($0.50)'],
                  ['Token type', transferable ? 'Transferable' : 'Soulbound'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-3)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--accent-ink)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                style={{ marginTop: 2, width: 14, height: 14, accentColor: 'var(--accent)', flexShrink: 0 }}
              />
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                I confirm the slug <strong style={{ color: 'var(--ink)' }}>{normalizedSlug || '…'}</strong> is correct.
                Slugs cannot be changed after creation.
              </span>
            </label>

            <button
              onClick={handleCreate}
              disabled={!canSubmit}
              className="btn btn-primary btn-full"
              style={{ padding: '12px 14px', fontSize: 14, opacity: canSubmit ? 1 : 0.5 }}
            >
              {isPending ? 'Confirm in wallet…' : isConfirming ? 'Creating project…' : 'Create project'}
            </button>

            {isSuccess && (
              <p style={{ color: 'var(--good)', fontSize: 12.5, textAlign: 'center' }}>
                ✓ Project created — returning to projects…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
