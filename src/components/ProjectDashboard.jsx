import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'
import { RWAID_ADDRESS } from '../lib/contracts'
import { getLogsChunked } from '../lib/readClient'
import MerkleRootPanel     from './panels/MerkleRootPanel'
import ClaimFeePanel       from './panels/ClaimFeePanel'
import TreasuryPanel       from './panels/TreasuryPanel'
import TransferabilityPanel from './panels/TransferabilityPanel'
import PausePanel          from './panels/PausePanel'
import TransferOwnershipPanel from './panels/TransferOwnershipPanel'
import RevokeIdentityPanel from './panels/RevokeIdentityPanel'

// ── Nav config ────────────────────────────────────────────────────────────────
const SIDENAV = [
  {
    group: 'Project',
    items: [
      { id: 'merkle',    label: 'Allowlist',
        icon: <path d="M3 4h10M3 8h10M3 12h7" /> },
      { id: 'fee',       label: 'Claim Fee',
        icon: <><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></> },
      { id: 'treasury',  label: 'Treasury',
        icon: <><path d="M2 6l6-3 6 3v7H2z"/><path d="M6 13V8h4v5"/></> },
      { id: 'transfer',  label: 'Transferability',
        icon: <><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></> },
      { id: 'pause',     label: 'Pause / Unpause',
        icon: <><rect x="4" y="3" width="2.5" height="10"/><rect x="9.5" y="3" width="2.5" height="10"/></> },
    ],
  },
  {
    group: 'Identities',
    items: [
      { id: 'revoke',    label: 'Revoke Identity',
        icon: <><circle cx="8" cy="8" r="6"/><path d="M4 4l8 8"/></> },
    ],
  },
  {
    group: 'Admin',
    items: [
      { id: 'ownership', label: 'Transfer Ownership',
        icon: <><circle cx="8" cy="6" r="3"/><path d="M2.5 14a5.5 5.5 0 0 1 11 0"/></> },
    ],
  },
]

function NavIcon({ children }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ flexShrink: 0 }}>
      {children}
    </svg>
  )
}

export default function ProjectDashboard({ projectId, project, onBack, onRefresh }) {
  const [tab, setTab] = useState('merkle')

  if (!project) return null

  const fee = project.claimFee > 0n ? project.claimFee : 500000n
  const [allowlisted, setAllowlisted] = useState(null)

  useEffect(() => {
    getLogsChunked({
      address: RWAID_ADDRESS,
      event: {
        name: 'MerkleRootUpdated', type: 'event',
        inputs: [
          { name: 'projectId',        type: 'uint256', indexed: true },
          { name: 'newRoot',          type: 'bytes32', indexed: false },
          { name: 'totalAllowlisted', type: 'uint256', indexed: false },
        ],
      },
      args: { projectId: BigInt(projectId) },
    }).then(logs => {
      if (logs.length > 0)
        setAllowlisted(Number(logs[logs.length - 1].args.totalAllowlisted))
    }).catch(() => {})
  }, [projectId])

  const claimed   = Number(project.totalClaimed)
  const claimPct  = allowlisted ? Math.round((claimed / allowlisted) * 100) : null

  return (
    <>
      {/* ── Subnav / breadcrumbs ── */}
      <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--ink-4)' }}>
            <button
              onClick={onBack}
              style={{ color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 0, padding: 0, font: 'inherit' }}
            >
              Projects
            </button>
            <span style={{ color: 'var(--ink-5)' }}>/</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{project.slug}</span>
            <span style={{ color: 'var(--ink-5)' }}>·</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-4)' }}>
              Project #{projectId}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button className="btn btn-sm" onClick={onRefresh}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8a6 6 0 1 0 6-6"/><path d="M2 3v3h3"/></svg>
              Refresh
            </button>
            <a
              href={`https://etherscan.io/token/0xD0B565C7134bDB16Fc3b8A9Cb5fdA003C37930c2`}
              target="_blank" rel="noreferrer"
              className="btn btn-sm"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              Etherscan
            </a>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '32px 32px',
        display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32,
      }}>

        {/* ── Sidenav ── */}
        <aside style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
          {SIDENAV.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: 22 }}>
              <div style={{
                fontFamily: 'var(--f-mono)', fontSize: 10.5,
                letterSpacing: '.12em', textTransform: 'uppercase',
                color: 'var(--ink-4)', padding: '0 10px 8px',
              }}>{group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map(({ id, label, icon }) => {
                  const active = tab === id
                  return (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                        fontSize: 13.5, textAlign: 'left', width: '100%',
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'var(--paper)' : 'var(--ink-2)',
                        transition: 'background .12s, color .12s',
                        cursor: 'pointer', border: 0, font: 'inherit',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--paper-2)'; e.currentTarget.style.color = 'var(--ink)' } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-2)' } }}
                    >
                      <span style={{ color: active ? 'var(--paper)' : 'var(--ink-3)', display: 'flex' }}>
                        <NavIcon>{icon}</NavIcon>
                      </span>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ── Content ── */}
        <main>
          {/* Page header */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 24, paddingBottom: 24,
            borderBottom: '1px solid var(--line)', marginBottom: 28,
          }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--f-display)', fontWeight: 600,
                fontSize: 36, letterSpacing: '-.02em', lineHeight: 1.05,
                margin: '0 0 4px', color: 'var(--ink)',
              }}>
                {project.slug}
                <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 400, fontSize: 14, color: 'var(--ink-4)', verticalAlign: 'middle', marginLeft: 12, letterSpacing: 0 }}>
                  {project.slug}.rwa-id.eth · #{projectId}
                </span>
              </h1>
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-3)', margin: '0 0 10px' }}>
                Owned by {project.owner?.slice(0, 6)}…{project.owner?.slice(-4)}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`tag ${project.active ? 'tag-good' : 'tag-bad'}`}>
                  <span className="dot" />
                  {project.active ? 'Active' : 'Paused'}
                </span>
                <span className="tag tag-neutral">
                  {project.transferable ? 'Transferable' : 'Soulbound'}
                </span>
                <span className="tag tag-accent">Mainnet</span>
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div className="stat-strip">
            <div className="stat-cell">
              <div className="stat-cell-label">Identities Claimed</div>
              <div className="stat-cell-value">{claimed.toLocaleString()}</div>
              <div className="stat-cell-meta">
                {claimPct != null ? `${claimPct}% claim rate` : 'of allowlist'}
              </div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Allowlisted</div>
              <div className="stat-cell-value">
                {allowlisted != null ? allowlisted.toLocaleString() : '—'}
              </div>
              <div className="stat-cell-meta">entries in Merkle tree</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Total Revenue</div>
              <div className="stat-cell-value">${formatUnits(project.totalRevenue, 6)}</div>
              <div className="stat-cell-meta">USDC · to treasury (70%)</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Claim Fee</div>
              <div className="stat-cell-value">${formatUnits(fee, 6)}</div>
              <div className="stat-cell-meta">USDC per claim</div>
            </div>
          </div>

          {/* Active panel */}
          <div id="panel-content" />
          {tab === 'merkle'    && <MerkleRootPanel      projectId={projectId} project={project} onRefresh={onRefresh} />}
          {tab === 'fee'       && <ClaimFeePanel        projectId={projectId} project={project} onRefresh={onRefresh} />}
          {tab === 'treasury'  && <TreasuryPanel        projectId={projectId} project={project} onRefresh={onRefresh} />}
          {tab === 'transfer'  && <TransferabilityPanel projectId={projectId} project={project} onRefresh={onRefresh} />}
          {tab === 'pause'     && <PausePanel           projectId={projectId} project={project} onRefresh={onRefresh} />}
          {tab === 'ownership' && <TransferOwnershipPanel projectId={projectId} project={project} onRefresh={onRefresh} />}
          {tab === 'revoke'    && <RevokeIdentityPanel  projectId={projectId} project={project} onRefresh={onRefresh} />}
        </main>
      </div>
    </>
  )
}
