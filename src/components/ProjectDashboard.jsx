import { useState } from 'react'
import { formatUnits } from 'viem'
import MerkleRootPanel from './panels/MerkleRootPanel'
import ClaimFeePanel from './panels/ClaimFeePanel'
import TreasuryPanel from './panels/TreasuryPanel'
import TransferabilityPanel from './panels/TransferabilityPanel'
import PausePanel from './panels/PausePanel'
import TransferOwnershipPanel from './panels/TransferOwnershipPanel'
import RevokeIdentityPanel from './panels/RevokeIdentityPanel'

const TABS = [
  { id: 'merkle',      label: 'Allowlist',          icon: '📋' },
  { id: 'fee',         label: 'Claim Fee',           icon: '💰' },
  { id: 'treasury',    label: 'Treasury',            icon: '🏦' },
  { id: 'transfer',    label: 'Transferability',     icon: '🔒' },
  { id: 'pause',       label: 'Pause / Unpause',     icon: '⏸️' },
  { id: 'ownership',   label: 'Transfer Ownership',  icon: '👤' },
  { id: 'revoke',      label: 'Revoke Identity',     icon: '🚫' },
]

export default function ProjectDashboard({ projectId, project, onBack, onRefresh }) {
  const [tab, setTab] = useState('merkle')

  if (!project) return null

  const fee = project.claimFee > 0n ? project.claimFee : 500000n

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-6"
      >
        ← Back to projects
      </button>

      {/* Project header */}
      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-['Syne'] text-2xl font-800 text-white">{project.slug}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                project.active
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {project.active ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-white/40 text-sm font-mono">{project.slug}.rwa-id.eth · Project #{projectId}</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-white font-semibold text-lg">{project.totalClaimed.toString()}</p>
              <p className="text-white/30 text-xs">Total Claimed</p>
            </div>
            <div>
              <p className="text-blue-400 font-semibold text-lg">${formatUnits(project.totalRevenue, 6)}</p>
              <p className="text-white/30 text-xs">Total Revenue</p>
            </div>
            <div>
              <p className="text-sky-400 font-semibold text-lg">${formatUnits(fee, 6)}</p>
              <p className="text-white/30 text-xs">Claim Fee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              tab === t.id
                ? 'bg-[#3d7fff] text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {tab === 'merkle'    && <MerkleRootPanel projectId={projectId} project={project} onRefresh={onRefresh} />}
        {tab === 'fee'       && <ClaimFeePanel projectId={projectId} project={project} onRefresh={onRefresh} />}
        {tab === 'treasury'  && <TreasuryPanel projectId={projectId} project={project} onRefresh={onRefresh} />}
        {tab === 'transfer'  && <TransferabilityPanel projectId={projectId} project={project} onRefresh={onRefresh} />}
        {tab === 'pause'     && <PausePanel projectId={projectId} project={project} onRefresh={onRefresh} />}
        {tab === 'ownership' && <TransferOwnershipPanel projectId={projectId} project={project} onRefresh={onRefresh} />}
        {tab === 'revoke'    && <RevokeIdentityPanel projectId={projectId} project={project} onRefresh={onRefresh} />}
      </div>
    </div>
  )
}
