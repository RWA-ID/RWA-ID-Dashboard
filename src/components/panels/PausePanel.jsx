import { useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function PausePanel({ projectId, project, onRefresh }) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess }          = useWaitForTransactionReceipt({ hash })

  useEffect(() => { if (isSuccess) onRefresh() }, [isSuccess])

  const handleToggle = () => {
    writeContract({ address: RWAID_ADDRESS, abi: RWAID_ABI,
      functionName: project.active ? 'pauseProject' : 'unpauseProject',
      args: [BigInt(projectId)] })
  }

  return (
    <section className="section">
      <h2 className="section-title">Project controls</h2>
      <p className="section-desc">
        Destructive actions. All require an on-chain transaction signed by the project owner wallet.
      </p>

      <div className="danger-zone" style={{ maxWidth: 560 }}>
        <h3>{project.active ? 'Pause claims' : 'Unpause claims'}</h3>

        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px' }}>
          {project.active
            ? 'Stop new identity claims while keeping existing identities intact. Allowlist data is preserved — unpause to resume.'
            : 'Allow users to claim new identities again. The existing allowlist and Merkle root remain unchanged.'}
        </p>

        <div style={{ marginBottom: 14 }}>
          <span className={`tag ${project.active ? 'tag-good' : 'tag-bad'}`}>
            <span className="dot" />
            Project is {project.active ? 'Active' : 'Paused'}
          </span>
        </div>

        {error && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 10 }}>{error.shortMessage || error.message}</p>}

        <button onClick={handleToggle} disabled={isPending || isConfirming} className="btn btn-danger">
          {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…'
            : project.active ? 'Pause project' : 'Unpause project'}
        </button>
        {isSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, marginTop: 8 }}>✓ Done</p>}
      </div>
    </section>
  )
}
