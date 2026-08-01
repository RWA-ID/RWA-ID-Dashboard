// The proof-set CID is not recoverable from chain state — only the root is stored
// onchain. We keep a local pointer so the console can rebuild the claim link.
const key = (projectId) => `rwa-id-allowlist-${projectId}`

export function saveAllowlist(projectId, cid, total) {
  try {
    localStorage.setItem(key(projectId), JSON.stringify({ cid, total, savedAt: Date.now() }))
  } catch { /* private mode / quota — the CID is still shown in this session */ }
}

export function loadAllowlist(projectId) {
  try {
    return JSON.parse(localStorage.getItem(key(projectId))) || null
  } catch {
    return null
  }
}

export function claimUrl(projectId, cid) {
  return `${window.location.origin}/?claim=${projectId}&proofs=${cid}`
}
