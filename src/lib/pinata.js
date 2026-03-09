const PINATA_JWT = import.meta.env.VITE_PINATA_JWT

export async function pinJSON(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const file = new File([blob], `${name}.json`, { type: 'application/json' })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  formData.append('network', 'public')

  const res = await fetch('https://uploads.pinata.cloud/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  })

  const result = await res.json()
  const cid = result?.data?.cid
  if (!cid) throw new Error('Pinata: no CID returned — ' + JSON.stringify(result))
  return cid
}

export function ipfsUrl(cid) {
  return `https://ipfs.io/ipfs/${cid}`
}
