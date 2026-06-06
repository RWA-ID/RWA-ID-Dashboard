import { useAccount, useDisconnect } from 'wagmi'
import { modal } from './lib/wagmi'
import ProjectList from './components/ProjectList'
import ClaimPage from './components/ClaimPage'
import Landing from './components/Landing'

const _params = new URLSearchParams(window.location.search)
const CLAIM_PROJECT_ID = _params.get('claim')
const CLAIM_CID        = _params.get('proofs')

export default function App() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (CLAIM_PROJECT_ID && CLAIM_CID) {
    return <ClaimPage projectId={CLAIM_PROJECT_ID} cid={CLAIM_CID} />
  }

  const handleDisconnect = async () => {
    try { await modal.disconnect() } catch {}
    try { disconnect() } catch {}
    window.location.reload()
  }

  if (!isConnected) {
    return <Landing onConnect={() => modal.open()} />
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* ── Top bar ── */}
      <header style={{
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--ink)', color: 'var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14,
              letterSpacing: '-.02em',
            }}>R</span>
            <span style={{
              fontFamily: 'var(--f-display)', fontWeight: 600,
              fontSize: 18, letterSpacing: '-.015em', color: 'var(--ink)',
            }}>
              RWA-ID
              <span style={{ color: 'var(--ink-4)', fontWeight: 500, padding: '0 4px' }}>/</span>
              <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>Console</span>
            </span>
          </div>

          {/* Wallet + disconnect */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 6px', borderRadius: 999,
              background: 'var(--ink)', color: 'var(--paper)',
              fontFamily: 'var(--f-mono)', fontSize: 12,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4d7ce8, #c46cff 50%, #ffba6c)',
                flexShrink: 0,
              }} />
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
            <button
              onClick={handleDisconnect}
              className="btn btn-sm"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <ProjectList address={address} />
    </div>
  )
}
