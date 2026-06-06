import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../lib/contracts'
import { readClient, getLogsChunked } from '../lib/readClient'
import ProjectDashboard from './ProjectDashboard'
import CreateProject from './CreateProject'

export default function ProjectList({ address }) {
  const [selected, setSelected]   = useState(null)
  const [creating, setCreating]   = useState(false)
  const [myProjects, setMyProjects] = useState([])
  const [allowlistCounts, setAllowlistCounts] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadProjects = async () => {
    if (!address) return
    setIsLoading(true)
    setLoadError('')
    try {
      const nextId = await readClient.readContract({
        address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'nextProjectId',
      })
      const total = Number(nextId) - 1
      if (total <= 0) { setMyProjects([]); setIsLoading(false); return }

      const calls = Array.from({ length: total }, (_, i) => ({
        address: RWAID_ADDRESS, abi: RWAID_ABI,
        functionName: 'projects', args: [BigInt(i + 1)],
      }))
      const results = await readClient.multicall({ contracts: calls, allowFailure: true })

      const FIELDS = ['owner','slug','slugHash','treasury','claimFee','transferable','merkleRoot','active','totalClaimed','totalRevenue']
      const owned = results
        .map((r, i) => {
          if (!r.result) return null
          const arr  = Array.isArray(r.result) ? r.result : Object.values(r.result)
          const data = Object.fromEntries(FIELDS.map((k, j) => [k, arr[j]]))
          return { id: i + 1, data }
        })
        .filter(p => p && p.data?.owner?.toLowerCase() === address.toLowerCase())

      setMyProjects(owned)

      // Fetch totalAllowlisted from MerkleRootUpdated events for each owned project
      if (owned.length > 0) {
        const counts = {}
        await Promise.all(owned.map(async ({ id }) => {
          try {
            const logs = await getLogsChunked({
              address: RWAID_ADDRESS,
              event: {
                name: 'MerkleRootUpdated', type: 'event',
                inputs: [
                  { name: 'projectId',        type: 'uint256', indexed: true },
                  { name: 'newRoot',          type: 'bytes32', indexed: false },
                  { name: 'totalAllowlisted', type: 'uint256', indexed: false },
                ],
              },
              args: { projectId: BigInt(id) },
            })
            if (logs.length > 0) {
              // Last log = most recent root update
              counts[id] = Number(logs[logs.length - 1].args.totalAllowlisted)
            }
          } catch { /* ignore per-project fetch errors */ }
        }))
        setAllowlistCounts(counts)
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [address])

  if (selected) {
    const project = myProjects.find(p => p.id === selected)
    return (
      <ProjectDashboard
        projectId={selected}
        project={project?.data}
        onBack={() => { setSelected(null); loadProjects() }}
        onRefresh={loadProjects}
      />
    )
  }

  if (creating) {
    return (
      <CreateProject
        address={address}
        onBack={() => setCreating(false)}
        onSuccess={() => { setCreating(false); loadProjects() }}
      />
    )
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>
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
            margin: '0 0 6px', color: 'var(--ink)',
          }}>
            Identity Projects
          </h1>
          <p style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            Manage allowlists, fees, and identities for your RWA-ID projects
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={loadProjects} className="btn btn-sm">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8a6 6 0 1 0 6-6"/><path d="M2 3v3h3"/></svg>
            Refresh
          </button>
          <button onClick={() => setCreating(true)} className="btn btn-primary">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3v10M3 8h10"/></svg>
            New Project
          </button>
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '2px solid var(--accent)', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>Loading projects…</p>
        </div>
      ) : loadError ? (
        <div className="callout bad">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v1"/></svg>
          {loadError}
        </div>
      ) : myProjects.length === 0 ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          border: '1px solid var(--line)', borderRadius: 'var(--radius)',
          background: 'var(--paper-2)',
        }}>
          <p style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>No projects yet</p>
          <p style={{ color: 'var(--ink-3)', fontSize: 13, margin: '0 0 20px' }}>
            Create your first project to issue identities under <code style={{ fontFamily: 'var(--f-mono)', color: 'var(--ink-2)' }}>*.rwa-id.eth</code>
          </p>
          <button onClick={() => setCreating(true)} className="btn btn-primary">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3v10M3 8h10"/></svg>
            Create First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {myProjects.map(({ id, data: p }) => {
            const allowlisted = allowlistCounts[id] ?? null
            const claimed     = Number(p.totalClaimed)
            const pct         = allowlisted ? Math.round((claimed / allowlisted) * 100) : null
            const fee         = p.claimFee > 0n ? p.claimFee : 500000n

            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                style={{
                  textAlign: 'left',
                  background: 'var(--paper)', border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)', padding: 0,
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  transition: 'border-color .15s, box-shadow .15s',
                  boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-line)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,217,.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)';         e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
              >
                {/* Card header */}
                <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 20, color: 'var(--ink)', letterSpacing: '-.01em' }}>
                        {p.slug}
                      </span>
                      <span className={`tag ${p.active ? 'tag-good' : 'tag-bad'}`}>
                        <span className="dot" />
                        {p.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--f-mono)', fontSize: 11.5, color: 'var(--ink-4)', margin: 0 }}>
                      {p.slug}.rwa-id.eth
                    </p>
                  </div>
                  <span style={{
                    fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--accent-ink)',
                    background: 'var(--accent-soft)', border: '1px solid var(--accent-line)',
                    borderRadius: 'var(--radius-sm)', padding: '3px 8px', flexShrink: 0,
                  }}>#{id}</span>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--line)' }}>
                  {[
                    { label: 'Claimed',     value: claimed + (pct != null ? ` (${pct}%)` : ''), color: 'var(--ink)' },
                    { label: 'Allowlisted', value: allowlisted != null ? String(allowlisted) : '—', color: 'var(--ink)' },
                    { label: 'Revenue',     value: `$${formatUnits(p.totalRevenue, 6)}`, color: 'var(--good)' },
                    { label: 'Claim Fee',   value: `$${formatUnits(fee, 6)}`, color: 'var(--accent)' },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} style={{
                      padding: '12px 18px',
                      borderRight: i % 2 === 0 ? '1px solid var(--line)' : 'none',
                      borderTop: i >= 2 ? '1px solid var(--line)' : 'none',
                    }}>
                      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--f-display)', fontWeight: 500, fontSize: 18, letterSpacing: '-.01em', color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 18px', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="tag tag-neutral">{p.transferable ? 'Transferable' : 'Soulbound'}</span>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Manage
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                  </span>
                </div>

              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
