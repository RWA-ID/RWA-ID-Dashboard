import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { isAddress } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function TreasuryPanel({ projectId, project, onRefresh }) {
  const [newTreasury, setNewTreasury] = useState('')

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess }          = useWaitForTransactionReceipt({ hash })

  useEffect(() => { if (isSuccess) onRefresh() }, [isSuccess])

  const isValid = isAddress(newTreasury)

  const handleSubmit = () => {
    writeContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'updateTreasury',
      args: [BigInt(projectId), newTreasury] })
  }

  return (
    <section className="section">
      <h2 className="section-title">Treasury</h2>
      <p className="section-desc">
        The treasury address receives 70% of every claim fee. Change it here — all future claim fees will route to the new address. Existing balances are unaffected.
      </p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-head"><h3>Update treasury address</h3><span className="meta">Receives 70% of claim fees</span></div>
        <div className="card-body">
          <div className="field">
            <span className="field-label">Current treasury</span>
            <div className="d-input mono disabled">
              <input type="text" value={project.treasury} disabled style={{ color: 'var(--ink-2)' }} />
            </div>
          </div>

          <div className="field">
            <label className="field-label">New treasury address</label>
            <div className="d-input mono">
              <input
                type="text"
                placeholder="0x…"
                value={newTreasury}
                onChange={e => setNewTreasury(e.target.value)}
              />
            </div>
            {newTreasury && !isValid && (
              <span style={{ color: 'var(--bad)', fontSize: 12 }}>Enter a valid Ethereum address</span>
            )}
            <span className="field-hint">All future claim fees will route to this address. Existing balances are unaffected.</span>
          </div>

          {error && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 12 }}>{error.shortMessage || error.message}</p>}

          <button onClick={handleSubmit} disabled={!isValid || isPending || isConfirming} className="btn btn-primary btn-full">
            {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Update treasury'}
          </button>
          {isSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>✓ Treasury updated</p>}
        </div>
      </div>
    </section>
  )
}
