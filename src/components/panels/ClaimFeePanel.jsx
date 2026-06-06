import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'

export default function ClaimFeePanel({ projectId, project, onRefresh }) {
  const [fee, setFee] = useState('')

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess }          = useWaitForTransactionReceipt({ hash })
  const { data: minFee }                                = useReadContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'minimumClaimFee' })

  useEffect(() => { if (isSuccess) onRefresh() }, [isSuccess])

  const currentFee      = project.claimFee > 0n ? formatUnits(project.claimFee, 6) : null
  const minFeeFormatted = minFee ? formatUnits(minFee, 6) : '0.50'

  const handleSubmit = () => {
    const parsed = fee ? parseUnits(fee, 6) : 0n
    writeContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'updateClaimFee',
      args: [BigInt(projectId), parsed] })
  }

  return (
    <section className="section">
      <h2 className="section-title">Claim Fee</h2>
      <p className="section-desc">
        Set the USDC fee required to claim an identity. Your treasury receives 70%, protocol receives 30%.
        Leave blank or set to 0 to use the protocol minimum (${minFeeFormatted} USDC).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Fee split card */}
        <div className="card">
          <div className="card-head"><h3>Current fee split</h3><span className="meta">USDC · per claim</span></div>
          <div className="card-body">
            <div className="fee-split">
              <div className="fee-cell">
                <div className="fee-cell-label">Your treasury</div>
                <div className="fee-cell-value">${currentFee ? (Number(currentFee) * 0.7).toFixed(2) : (Number(minFeeFormatted) * 0.7).toFixed(2)}</div>
                <div className="fee-cell-meta">70% of fee</div>
              </div>
              <div className="fee-cell">
                <div className="fee-cell-label">Protocol</div>
                <div className="fee-cell-value">${currentFee ? (Number(currentFee) * 0.3).toFixed(2) : (Number(minFeeFormatted) * 0.3).toFixed(2)}</div>
                <div className="fee-cell-meta">30%</div>
              </div>
            </div>
            <div style={{ padding: '14px 0 0', borderTop: '1px solid var(--line)', display: 'flex', gap: 20 }}>
              <div className="kv">
                <div className="kv-label">Current fee</div>
                <div className="kv-value" style={{ fontSize: 18, fontFamily: 'var(--f-display)', fontWeight: 500 }}>
                  ${currentFee ?? `${minFeeFormatted} (min)`}
                </div>
              </div>
              <div className="kv">
                <div className="kv-label">Protocol minimum</div>
                <div className="kv-value">${minFeeFormatted}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Update fee card */}
        <div className="card">
          <div className="card-head"><h3>Update claim fee</h3></div>
          <div className="card-body">
            <div className="field">
              <label className="field-label">New fee (USDC)</label>
              <div className="d-input mono">
                <input
                  type="number"
                  placeholder={`0 = protocol min ($${minFeeFormatted})`}
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                />
                <span className="suffix">USDC</span>
              </div>
              <span className="field-hint">Protocol minimum is ${minFeeFormatted}. Set to 0 to inherit the protocol minimum.</span>
            </div>

            {error && <p style={{ color: 'var(--bad)', fontSize: 12, marginBottom: 12 }}>{error.shortMessage || error.message}</p>}

            <button onClick={handleSubmit} disabled={isPending || isConfirming} className="btn btn-accent btn-full">
              {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Update claim fee'}
            </button>
            {isSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>✓ Claim fee updated</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
