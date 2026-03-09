import { useState, useRef } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAID_ADDRESS, RWAID_ABI } from '../../lib/contracts'
import { parseCSV, buildMerkleTree } from '../../lib/merkle'
import { pinJSON, ipfsUrl } from '../../lib/pinata'

const MODES = [
  { id: 'csv',    label: '📂 Upload CSV' },
  { id: 'manual', label: '✏️  Manual Entry' },
]

export default function MerkleRootPanel({ projectId, project, onRefresh }) {
  const [mode, setMode] = useState('csv')

  // CSV state
  const [csvRows, setCsvRows] = useState(null)
  const [csvError, setCsvError] = useState('')
  const [building, setBuilding] = useState(false)
  const [result, setResult] = useState(null)
  const [pinning, setPinning] = useState(false)
  const fileRef = useRef()

  // Manual state
  const [manualEntries, setManualEntries] = useState([{ name: '', wallet: '' }])
  const [ipfsCid, setIpfsCid] = useState('')
  const [loadingIpfs, setLoadingIpfs] = useState(false)
  const [ipfsError, setIpfsError] = useState('')
  const [manualResult, setManualResult] = useState(null)
  const [manualBuilding, setManualBuilding] = useState(false)
  const [manualPinning, setManualPinning] = useState(false)
  const [manualError, setManualError] = useState('')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) onRefresh()

  // ── CSV handling ──────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvError('')
    setResult(null)
    setCsvRows(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result)
        setCsvRows(rows)
      } catch (err) {
        setCsvError(err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleBuildAndPin = async () => {
    if (!csvRows) return
    setBuilding(true)
    setCsvError('')
    try {
      const { root, entries } = buildMerkleTree(csvRows)
      setPinning(true)
      const proofData = {
        projectId: projectId.toString(),
        projectSlug: project.slug,
        merkleRoot: root,
        generatedAt: new Date().toISOString(),
        totalEntries: entries.length,
        entries: entries.map(e => ({
          name: e.name,
          wallet: e.address,
          nameHash: e.nameHash,
          leaf: e.leaf,
          proof: e.proof,
        })),
      }
      const cid = await pinJSON(proofData, `rwa-id-${project.slug}-allowlist`)
      setPinning(false)
      setResult({ root, entries, cid })
    } catch (err) {
      setCsvError(err.message)
      setPinning(false)
    } finally {
      setBuilding(false)
    }
  }

  const handleSubmitCSV = () => {
    if (!result) return
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'updateMerkleRoot',
      args: [BigInt(projectId), result.root, BigInt(result.entries.length)],
    })
  }

  // ── Manual handling ───────────────────────────────────────────────────────

  const handleLoadIpfs = async () => {
    if (!ipfsCid.trim()) return
    setLoadingIpfs(true)
    setIpfsError('')
    try {
      const url = `https://ipfs.io/ipfs/${ipfsCid.trim()}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`IPFS fetch failed (${resp.status})`)
      const data = await resp.json()
      const existing = (data.entries || []).map(e => ({ name: e.name || '', wallet: e.wallet || e.address || '' }))
      if (existing.length === 0) throw new Error('No entries found in IPFS JSON')
      setManualEntries([...existing, { name: '', wallet: '' }])
    } catch (err) {
      setIpfsError(err.message)
    } finally {
      setLoadingIpfs(false)
    }
  }

  const updateEntry = (i, field, value) => {
    setManualEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  const addRow = () => setManualEntries(prev => [...prev, { name: '', wallet: '' }])

  const removeRow = (i) => setManualEntries(prev => prev.filter((_, idx) => idx !== i))

  const validManualRows = manualEntries.filter(e => e.name.trim() && e.wallet.trim().startsWith('0x') && e.wallet.length === 42)

  const handleBuildManual = async () => {
    if (validManualRows.length === 0) return
    setManualBuilding(true)
    setManualError('')
    try {
      const rows = validManualRows.map(e => ({ name: e.name.trim(), address: e.wallet.trim() }))
      const { root, entries } = buildMerkleTree(rows)
      setManualPinning(true)
      const proofData = {
        projectId: projectId.toString(),
        projectSlug: project.slug,
        merkleRoot: root,
        generatedAt: new Date().toISOString(),
        totalEntries: entries.length,
        entries: entries.map(e => ({
          name: e.name,
          wallet: e.address,
          nameHash: e.nameHash,
          leaf: e.leaf,
          proof: e.proof,
        })),
      }
      const cid = await pinJSON(proofData, `rwa-id-${project.slug}-allowlist`)
      setManualPinning(false)
      setManualResult({ root, entries, cid })
    } catch (err) {
      setManualError(err.message)
      setManualPinning(false)
    } finally {
      setManualBuilding(false)
    }
  }

  const handleSubmitManual = () => {
    if (!manualResult) return
    writeContract({
      address: RWAID_ADDRESS,
      abi: RWAID_ABI,
      functionName: 'updateMerkleRoot',
      args: [BigInt(projectId), manualResult.root, BigInt(manualResult.entries.length)],
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <h3 className="font-['Syne'] text-lg font-700 text-white mb-1">Update Allowlist</h3>
      <p className="text-white/40 text-sm mb-5">
        Leaf format: <code className="text-blue-300 bg-white/5 px-1 rounded text-xs">keccak256(abi.encodePacked(wallet, nameHash))</code>
        &nbsp;where <code className="text-blue-300 bg-white/5 px-1 rounded text-xs">nameHash = keccak256(bytes(name))</code>
      </p>

      {/* Current root */}
      <div className="mb-5 p-3 bg-white/5 rounded-xl">
        <p className="text-xs text-white/30 mb-1">Current Merkle Root</p>
        <p className="text-white/50 text-xs font-mono break-all">
          {project.merkleRoot === '0x0000000000000000000000000000000000000000000000000000000000000000'
            ? 'Not set'
            : project.merkleRoot}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null); setManualResult(null); setCsvRows(null); setCsvError('') }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === m.id
                ? 'bg-[#3d7fff] text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── CSV Mode ── */}
      {mode === 'csv' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-white/40 mb-2">
              CSV format — two columns, one row per client:
            </p>
            <pre className="text-xs text-blue-300 bg-white/5 rounded-lg px-3 py-2 mb-3 font-mono">
{`name,wallet
alice,0xAbc...
bob,0xDef...`}
            </pre>

            <input type="file" accept=".csv,text/csv" ref={fileRef} onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current.click()}
              className="w-full py-8 border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-xl text-white/40 hover:text-blue-400 transition-all text-sm"
            >
              {csvRows
                ? `✓ ${csvRows.length} rows loaded — click to replace`
                : '📂 Click to select CSV file'}
            </button>
            {csvError && <p className="text-red-400 text-sm mt-2">{csvError}</p>}
          </div>

          {csvRows && !result && (
            <div className="p-3 bg-white/5 rounded-xl text-sm text-white/60">
              <strong className="text-white">{csvRows.length}</strong> entries ready.
              Click below to generate the Merkle tree and pin proofs to IPFS.
            </div>
          )}

          {!result && (
            <button
              onClick={handleBuildAndPin}
              disabled={!csvRows || building || pinning}
              className="w-full py-3 bg-[#3d7fff]/80 hover:bg-[#3d7fff] disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
            >
              {building && !pinning ? 'Building Merkle tree...' : pinning ? 'Pinning proofs to IPFS...' : 'Build Tree & Pin Proofs'}
            </button>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <p className="text-xs text-white/40 mb-1">✓ Merkle Root Generated</p>
                <p className="text-green-400 text-xs font-mono break-all">{result.root}</p>
                <p className="text-white/30 text-xs mt-2">{result.entries.length} entries</p>
              </div>
              <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                <p className="text-xs text-white/40 mb-1">✓ Proofs pinned to IPFS</p>
                <a href={ipfsUrl(result.cid)} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 text-xs font-mono break-all hover:text-blue-300 underline">
                  ipfs://{result.cid}
                </a>
                <p className="text-white/30 text-xs mt-1">Share this link with clients so they can retrieve their proof.</p>
              </div>
              <button
                onClick={handleSubmitCSV}
                disabled={isPending || isConfirming}
                className="w-full py-3 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
              >
                {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Update Merkle Root On-Chain'}
              </button>
              {isSuccess && <p className="text-green-400 text-sm text-center">✓ Merkle root updated on-chain</p>}
            </div>
          )}
        </div>
      )}

      {/* ── Manual Mode ── */}
      {mode === 'manual' && (
        <div className="space-y-5">
          {/* Load existing from IPFS */}
          <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-xs text-white/50 mb-2 font-semibold">Load existing allowlist from IPFS (optional)</p>
            <p className="text-xs text-white/30 mb-3">
              Paste the IPFS CID from a previous upload to pre-populate existing entries and add new ones on top.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="bafkrei..."
                value={ipfsCid}
                onChange={e => setIpfsCid(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
              />
              <button
                onClick={handleLoadIpfs}
                disabled={!ipfsCid.trim() || loadingIpfs}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {loadingIpfs ? 'Loading...' : 'Load'}
              </button>
            </div>
            {ipfsError && <p className="text-red-400 text-xs mt-2">{ipfsError}</p>}
          </div>

          {/* Entry rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50 font-semibold">Allowlist entries</p>
              <span className="text-xs text-white/30">{validManualRows.length} valid</span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-1 px-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wide">Name / Handle</span>
              <span className="text-[10px] text-white/30 uppercase tracking-wide">Wallet Address</span>
              <span className="w-7" />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {manualEntries.map((entry, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    type="text"
                    placeholder="alice"
                    value={entry.name}
                    onChange={e => updateEntry(i, 'name', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
                  />
                  <input
                    type="text"
                    placeholder="0x..."
                    value={entry.wallet}
                    onChange={e => updateEntry(i, 'wallet', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
                  />
                  <button
                    onClick={() => removeRow(i)}
                    disabled={manualEntries.length === 1}
                    className="w-7 h-9 flex items-center justify-center text-white/20 hover:text-red-400 disabled:opacity-20 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="mt-3 w-full py-2 border border-dashed border-white/10 hover:border-blue-500/30 rounded-lg text-white/30 hover:text-blue-400 text-sm transition-all"
            >
              + Add row
            </button>
          </div>

          {manualError && <p className="text-red-400 text-sm">{manualError}</p>}

          {!manualResult ? (
            <button
              onClick={handleBuildManual}
              disabled={validManualRows.length === 0 || manualBuilding || manualPinning}
              className="w-full py-3 bg-[#3d7fff]/80 hover:bg-[#3d7fff] disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
            >
              {manualBuilding && !manualPinning ? 'Building Merkle tree...' : manualPinning ? 'Pinning to IPFS...' : `Build Tree & Pin (${validManualRows.length} entries)`}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <p className="text-xs text-white/40 mb-1">✓ Merkle Root Generated</p>
                <p className="text-green-400 text-xs font-mono break-all">{manualResult.root}</p>
                <p className="text-white/30 text-xs mt-2">{manualResult.entries.length} entries</p>
              </div>
              <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                <p className="text-xs text-white/40 mb-1">✓ Proofs pinned to IPFS</p>
                <a href={ipfsUrl(manualResult.cid)} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 text-xs font-mono break-all hover:text-blue-300 underline">
                  ipfs://{manualResult.cid}
                </a>
              </div>
              <button
                onClick={handleSubmitManual}
                disabled={isPending || isConfirming}
                className="w-full py-3 bg-[#3d7fff] hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-all"
              >
                {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Update Merkle Root On-Chain'}
              </button>
              {isSuccess && <p className="text-green-400 text-sm text-center">✓ Merkle root updated on-chain</p>}
              <button onClick={() => setManualResult(null)} className="w-full text-white/30 hover:text-white/50 text-xs transition-colors">
                ← Edit entries
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
