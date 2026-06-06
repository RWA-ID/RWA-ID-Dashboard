import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import NameLookup from './NameLookup'

export default function TransferabilityPanel({ projectId, project, onRefresh }) {
  const [tokenId, setTokenId]               = useState('')
  const [tokenTransferable, setTokenTransferable] = useState(true)

  const { writeContract: writeProject, data: projectHash, isPending: projectPending, error: projectError } = useWriteContract()
  const { writeContract: writeToken,   data: tokenHash,   isPending: tokenPending,   error: tokenError   } = useWriteContract()

  const { isLoading: projectConfirming, isSuccess: projectSuccess } = useWaitForTransactionReceipt({ hash: projectHash })
  const { isLoading: tokenConfirming,   isSuccess: tokenSuccess   } = useWaitForTransactionReceipt({ hash: tokenHash })

  useEffect(() => { if (projectSuccess) onRefresh() }, [projectSuccess])
  useEffect(() => { if (tokenSuccess)   onRefresh() }, [tokenSuccess])

  const handleProjectTransfer = (val) => {
    writeProject({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'setProjectTransferable',
      args: [BigInt(projectId), val] })
  }

  const handleTokenTransfer = () => {
    writeToken({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'setTokenTransferable',
      args: [BigInt(tokenId), tokenTransferable] })
  }

  return (
    <section className="section">
      <h2 className="section-title">Transferability</h2>
      <p className="section-desc">
        Set the default for new tokens and override specific already-minted tokens.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Project default */}
        <div className="card">
          <div className="card-head">
            <h3>Project default</h3>
            <span className="meta">Applies to new tokens only</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>
              Sets the default transferability for all <em>new</em> tokens minted in this project. Existing tokens are unaffected.
            </p>

            <div className="radio-group" style={{ marginBottom: 16 }}>
              <button
                className={`radio-card${!project.transferable ? '' : ' is-active'}`}
                onClick={() => handleProjectTransfer(true)}
                disabled={project.transferable || projectPending || projectConfirming}
              >
                <div className="radio-card-head">
                  <span className="radio-dot" />
                  <span className="radio-card-title">Transferable</span>
                </div>
                <div className="radio-card-desc">Standard ERC-721 — owners can transfer tokens between wallets.</div>
              </button>
              <button
                className={`radio-card${!project.transferable ? ' is-active' : ''}`}
                onClick={() => handleProjectTransfer(false)}
                disabled={!project.transferable || projectPending || projectConfirming}
              >
                <div className="radio-card-head">
                  <span className="radio-dot" />
                  <span className="radio-card-title">Soulbound</span>
                </div>
                <div className="radio-card-desc">Identities are non-transferable. Recommended for KYC-bound tokens.</div>
              </button>
            </div>

            {projectError && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 10 }}>{projectError.shortMessage || projectError.message}</p>}
            {projectSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, marginBottom: 8 }}>✓ Project transferability updated</p>}

            <span className="tag tag-neutral">
              Currently: {project.transferable ? 'Transferable' : 'Soulbound'}
            </span>
          </div>
        </div>

        {/* Per-token override */}
        <div className="card">
          <div className="card-head">
            <h3>Per-token override</h3>
            <span className="meta">Override a specific token</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>
              Override transferability on a specific already-minted token. Look up a name to pre-fill, or enter a token ID manually.
            </p>

            <NameLookup projectId={projectId} projectSlug={project.slug} onSelect={id => setTokenId(id)} />

            <div className="field">
              <label className="field-label">Token ID</label>
              <div className="d-input mono">
                <input type="number" placeholder="e.g. 42" value={tokenId} onChange={e => setTokenId(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Set to</label>
              <div className="radio-group">
                <button className={`radio-card${!tokenTransferable ? ' is-active' : ''}`} onClick={() => setTokenTransferable(false)}>
                  <div className="radio-card-head"><span className="radio-dot" /><span className="radio-card-title">Soulbound</span></div>
                </button>
                <button className={`radio-card${tokenTransferable ? ' is-active' : ''}`} onClick={() => setTokenTransferable(true)}>
                  <div className="radio-card-head"><span className="radio-dot" /><span className="radio-card-title">Transferable</span></div>
                </button>
              </div>
            </div>

            {tokenError && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 10 }}>{tokenError.shortMessage || tokenError.message}</p>}

            <button onClick={handleTokenTransfer} disabled={!tokenId || tokenPending || tokenConfirming} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
              {tokenPending ? 'Confirm in wallet…' : tokenConfirming ? 'Confirming…' : 'Update token'}
            </button>
            {tokenSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>✓ Token transferability updated</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
