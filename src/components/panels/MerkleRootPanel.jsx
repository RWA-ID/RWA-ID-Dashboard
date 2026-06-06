import { useState, useRef, useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import { parseCSV, buildMerkleTree } from '../../lib/merkle'
import { pinJSON } from '../../lib/pinata'

function lsKey(projectId)            { return `rwa-id-allowlist-${projectId}` }
function saveAllowlist(pid, cid, n)  { try { localStorage.setItem(lsKey(pid), JSON.stringify({ cid, total: n })) } catch {} }
function loadAllowlist(pid)          { try { return JSON.parse(localStorage.getItem(lsKey(pid))) || null } catch { return null } }

function ClaimLinkBox({ projectId, cid, total, copied, onCopy }) {
  return (
    <div className="callout" style={{ flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 12.5 }}>Claim Link</span>
        {total != null && <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-4)' }}>{total} allowlisted</span>}
      </div>
      <div className="hash-chip" style={{ display: 'block', wordBreak: 'break-all', fontSize: 11.5 }}>
        {window.location.origin}/?claim={projectId}&proofs={cid}
      </div>
      <button onClick={onCopy} className="btn btn-accent btn-full">
        {copied ? '✓ Copied' : 'Copy Claim Link'}
      </button>
    </div>
  )
}

export default function MerkleRootPanel({ projectId, project, onRefresh }) {
  const [mode, setMode]             = useState('csv')
  const [linkCopied, setLinkCopied] = useState(false)
  const [saved, setSaved]           = useState(() => loadAllowlist(projectId))

  // CSV state
  const [csvRows, setCsvRows]   = useState(null)
  const [csvError, setCsvError] = useState('')
  const [building, setBuilding] = useState(false)
  const [pinning, setPinning]   = useState(false)
  const [result, setResult]     = useState(null)
  const fileRef = useRef()

  // Manual state
  const [manualEntries, setManualEntries] = useState([{ name: '', wallet: '' }])
  const [ipfsCid, setIpfsCid]             = useState('')
  const [loadingIpfs, setLoadingIpfs]     = useState(false)
  const [ipfsError, setIpfsError]         = useState('')
  const [manualResult, setManualResult]   = useState(null)
  const [manualBuilding, setManualBuilding] = useState(false)
  const [manualPinning, setManualPinning]   = useState(false)
  const [manualError, setManualError]       = useState('')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess }   = useWaitForTransactionReceipt({ hash })
  if (isSuccess) onRefresh()

  const copyLink = useCallback((cid) => {
    navigator.clipboard.writeText(`${window.location.origin}/?claim=${projectId}&proofs=${cid}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }, [projectId])

  // ── CSV ───────────────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return
    setCsvError(''); setResult(null); setCsvRows(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { setCsvRows(parseCSV(ev.target.result)) }
      catch (err) { setCsvError(err.message) }
    }
    reader.readAsText(file)
  }

  const handleBuildAndPin = async () => {
    if (!csvRows) return
    setBuilding(true); setCsvError('')
    try {
      const { root, entries } = buildMerkleTree(csvRows)
      setPinning(true)
      const cid = await pinJSON({
        projectId: projectId.toString(), projectSlug: project.slug,
        merkleRoot: root, generatedAt: new Date().toISOString(),
        totalEntries: entries.length,
        entries: entries.map(e => ({ name: e.name, wallet: e.address, nameHash: e.nameHash, leaf: e.leaf, proof: e.proof })),
      }, `rwa-id-${project.slug}-allowlist`)
      setPinning(false)
      setResult({ root, entries, cid })
      const ns = { cid, total: entries.length }
      setSaved(ns); saveAllowlist(projectId, cid, entries.length)
    } catch (err) { setCsvError(err.message); setPinning(false) }
    finally { setBuilding(false) }
  }

  const handleSubmitCSV = () => {
    if (!result) return
    writeContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'updateMerkleRoot',
      args: [BigInt(projectId), result.root, BigInt(result.entries.length)] })
  }

  // ── Manual ────────────────────────────────────────────────────────────────
  const handleLoadIpfs = async () => {
    if (!ipfsCid.trim()) return
    setLoadingIpfs(true); setIpfsError('')
    try {
      const resp = await fetch(`https://ipfs.io/ipfs/${ipfsCid.trim()}`)
      if (!resp.ok) throw new Error(`IPFS fetch failed (${resp.status})`)
      const data = await resp.json()
      const existing = (data.entries || []).map(e => ({ name: e.name || '', wallet: e.wallet || e.address || '' }))
      if (existing.length === 0) throw new Error('No entries found in IPFS JSON')
      setManualEntries([...existing, { name: '', wallet: '' }])
    } catch (err) { setIpfsError(err.message) }
    finally { setLoadingIpfs(false) }
  }

  const updateEntry = (i, field, value) =>
    setManualEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  const addRow    = ()  => setManualEntries(prev => [...prev, { name: '', wallet: '' }])
  const removeRow = (i) => setManualEntries(prev => prev.filter((_, idx) => idx !== i))

  const validManualRows = manualEntries.filter(e =>
    e.name.trim() && e.wallet.trim().startsWith('0x') && e.wallet.length === 42)

  const handleBuildManual = async () => {
    if (validManualRows.length === 0) return
    setManualBuilding(true); setManualError('')
    try {
      const rows = validManualRows.map(e => ({ name: e.name.trim(), address: e.wallet.trim() }))
      const { root, entries } = buildMerkleTree(rows)
      setManualPinning(true)
      const cid = await pinJSON({
        projectId: projectId.toString(), projectSlug: project.slug,
        merkleRoot: root, generatedAt: new Date().toISOString(),
        totalEntries: entries.length,
        entries: entries.map(e => ({ name: e.name, wallet: e.address, nameHash: e.nameHash, leaf: e.leaf, proof: e.proof })),
      }, `rwa-id-${project.slug}-allowlist`)
      setManualPinning(false)
      setManualResult({ root, entries, cid })
      const ns = { cid, total: entries.length }
      setSaved(ns); saveAllowlist(projectId, cid, entries.length)
    } catch (err) { setManualError(err.message); setManualPinning(false) }
    finally { setManualBuilding(false) }
  }

  const handleSubmitManual = () => {
    if (!manualResult) return
    writeContract({ address: RWAID_ADDRESS, abi: RWAID_ABI, functionName: 'updateMerkleRoot',
      args: [BigInt(projectId), manualResult.root, BigInt(manualResult.entries.length)] })
  }

  const activeCid   = result?.cid || manualResult?.cid
  const activeTotal = result?.entries?.length || manualResult?.entries?.length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="section">
      <h2 className="section-title">Allowlist</h2>
      <p className="section-desc">
        Manage who can claim an identity under{' '}
        <code style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>
          {project.slug}.rwa-id.eth
        </code>. Upload a CSV or enter entries manually — the dashboard builds the Merkle tree locally, pins proofs to IPFS, and submits the new root in one transaction.
      </p>

      <div className="card">
        <div className="card-head">
          <h3>Current allowlist</h3>
          {project.merkleRoot && project.merkleRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
            <span className="tag tag-good" style={{ marginLeft: 'auto' }}>
              <span className="dot" />On-chain
            </span>
          )}
        </div>

        {/* Merkle root + IPFS display */}
        <div style={{
          display: 'flex', gap: 20, padding: '14px 18px',
          borderBottom: '1px solid var(--line)', background: 'var(--paper-2)',
        }}>
          <div className="kv">
            <div className="kv-label">Merkle Root</div>
            <div className="hash-chip" style={{ fontSize: 11, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.merkleRoot === '0x0000000000000000000000000000000000000000000000000000000000000000'
                ? 'Not set'
                : `${project.merkleRoot.slice(0, 10)}…${project.merkleRoot.slice(-6)}`}
            </div>
          </div>
          {saved?.cid && (
            <div className="kv">
              <div className="kv-label">IPFS CID</div>
              <div className="hash-chip" style={{ fontSize: 11 }}>{saved.cid.slice(0, 12)}…</div>
            </div>
          )}
          {saved?.total != null && (
            <div className="kv">
              <div className="kv-label">Total entries</div>
              <div className="kv-value">{saved.total.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Persisted claim link */}
        {saved && !activeCid && (
          <div style={{ padding: '0 18px 18px', paddingTop: 18 }}>
            <ClaimLinkBox projectId={projectId} cid={saved.cid} total={saved.total} copied={linkCopied} onCopy={() => copyLink(saved.cid)} />
          </div>
        )}

        <div className="card-body card-body-tight">
          {/* Mode tabs */}
          <div style={{ padding: '14px 18px 0', display: 'flex', gap: 6 }}>
            {[{ id: 'csv', label: 'Upload CSV' }, { id: 'manual', label: 'Manual Entry' }].map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setResult(null); setManualResult(null); setCsvRows(null); setCsvError('') }}
                className={m.id === mode ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* ── CSV Mode ── */}
          {mode === 'csv' && (
            <div style={{ padding: 18 }}>
              <pre className="csv-format" style={{ margin: '0 0 16px' }}>
                <span className="hd">name,wallet</span>{'\n'}alice,0xAbc…{'\n'}bob,0xDef…
              </pre>

              <input type="file" accept=".csv,text/csv" ref={fileRef} onChange={handleFile} style={{ display: 'none' }} />

              <div className="upload" style={{ margin: '0 0 16px' }}>
                <div className="upload-title">{csvRows ? `✓ ${csvRows.length} rows loaded` : 'Upload a new allowlist'}</div>
                <div className="upload-sub">CSV — two columns: <code style={{ fontFamily: 'var(--f-mono)' }}>name,wallet</code>. Drop the file or browse.</div>
                <div style={{ display: 'inline-flex', gap: 8 }}>
                  <button className="btn btn-accent" onClick={() => fileRef.current.click()}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12v1.5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5V12M8 11V2M5 5l3-3 3 3"/></svg>
                    Select CSV
                  </button>
                  <button className="btn" onClick={() => { setMode('manual'); setResult(null); setCsvRows(null); setCsvError('') }}>
                    Add entries manually
                  </button>
                </div>
              </div>

              {csvError && <p style={{ color: 'var(--bad)', fontSize: 12.5, marginBottom: 12 }}>{csvError}</p>}

              {!result && (
                <button
                  onClick={handleBuildAndPin}
                  disabled={!csvRows || building || pinning}
                  className="btn btn-accent btn-full"
                >
                  {building && !pinning ? 'Building Merkle tree…' : pinning ? 'Pinning proofs to IPFS…' : 'Build Tree & Pin Proofs'}
                </button>
              )}

              {result && (
                <div>
                  <ClaimLinkBox projectId={projectId} cid={result.cid} total={result.entries.length} copied={linkCopied} onCopy={() => copyLink(result.cid)} />
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                    <div className="field">
                      <span className="field-label">New Merkle Root</span>
                      <div className="hash-chip" style={{ display: 'block', wordBreak: 'break-all', fontSize: 11 }}>{result.root}</div>
                    </div>
                    <button
                      onClick={handleSubmitCSV}
                      disabled={isPending || isConfirming || isSuccess}
                      className="btn btn-primary btn-full"
                      style={{ marginTop: 8 }}
                    >
                      {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : isSuccess ? '✓ Merkle root updated' : 'Submit Merkle root on-chain'}
                    </button>
                    {isSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>✓ Allowlist is now active on-chain</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Manual Mode ── */}
          {mode === 'manual' && (
            <div style={{ padding: 18 }}>
              {/* Load from IPFS */}
              <div className="field">
                <span className="field-label">Load existing allowlist from IPFS (optional)</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="d-input mono" style={{ flex: 1 }}>
                    <input type="text" placeholder="bafkrei…" value={ipfsCid} onChange={e => setIpfsCid(e.target.value)} />
                  </div>
                  <button onClick={handleLoadIpfs} disabled={!ipfsCid.trim() || loadingIpfs} className="btn">
                    {loadingIpfs ? 'Loading…' : 'Load'}
                  </button>
                </div>
                {ipfsError && <span style={{ color: 'var(--bad)', fontSize: 12 }}>{ipfsError}</span>}
              </div>

              {/* Entry table */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="field-label">Allowlist entries</span>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-4)' }}>{validManualRows.length} valid</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, maxHeight: 260, overflowY: 'auto', paddingRight: 2 }}>
                  {manualEntries.map((entry, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <div className="d-input"><input type="text" placeholder="alice" value={entry.name} onChange={e => updateEntry(i, 'name', e.target.value)} /></div>
                      <div className="d-input mono"><input type="text" placeholder="0x…" value={entry.wallet} onChange={e => updateEntry(i, 'wallet', e.target.value)} /></div>
                      <button onClick={() => removeRow(i)} disabled={manualEntries.length === 1}
                        style={{ width: 32, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', cursor: 'pointer', border: 0, background: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--bad)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-4)'}
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addRow} className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8, borderStyle: 'dashed' }}>
                  + Add row
                </button>
              </div>

              {manualError && <p style={{ color: 'var(--bad)', fontSize: 12.5, marginBottom: 12 }}>{manualError}</p>}

              {!manualResult ? (
                <button onClick={handleBuildManual} disabled={validManualRows.length === 0 || manualBuilding || manualPinning} className="btn btn-accent btn-full">
                  {manualBuilding && !manualPinning ? 'Building…' : manualPinning ? 'Pinning to IPFS…' : `Build Tree & Pin (${validManualRows.length} entries)`}
                </button>
              ) : (
                <div>
                  <ClaimLinkBox projectId={projectId} cid={manualResult.cid} total={manualResult.entries.length} copied={linkCopied} onCopy={() => copyLink(manualResult.cid)} />
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                    <button onClick={handleSubmitManual} disabled={isPending || isConfirming || isSuccess} className="btn btn-primary btn-full">
                      {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : isSuccess ? '✓ Updated' : 'Submit Merkle root on-chain'}
                    </button>
                    {isSuccess && <p style={{ color: 'var(--good)', fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>✓ Allowlist is now active on-chain</p>}
                  </div>
                  <button onClick={() => setManualResult(null)} style={{ display: 'block', marginTop: 12, color: 'var(--ink-4)', fontSize: 12.5, cursor: 'pointer', border: 0, background: 'none', padding: 0 }}>
                    ← Edit entries
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="steps">
          <div className={`step ${(result || manualResult || saved) ? 'is-done' : 'is-current'}`}>
            <span className="step-num"><span>1</span></span>
            <div className="step-title">Build tree locally</div>
            <div className="step-meta">keccak256(wallet, nameHash)</div>
          </div>
          <div className={`step ${(result?.cid || manualResult?.cid || saved?.cid) ? 'is-done' : (csvRows || validManualRows.length > 0) ? 'is-current' : ''}`}>
            <span className="step-num"><span>2</span></span>
            <div className="step-title">Pin proofs to IPFS</div>
            <div className="step-meta">via Pinata</div>
          </div>
          <div className={`step ${isSuccess ? 'is-done' : (result || manualResult) ? 'is-current' : ''}`}>
            <span className="step-num"><span>3</span></span>
            <div className="step-title">Submit root on-chain</div>
            <div className="step-meta">1 transaction required</div>
          </div>
        </div>

        {(result || manualResult) && (
          <div className="card-foot">
            <span>1 of 1 transactions required</span>
            <button
              onClick={result ? handleSubmitCSV : handleSubmitManual}
              disabled={isPending || isConfirming || isSuccess}
              className="btn btn-accent btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Submit Merkle root'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
