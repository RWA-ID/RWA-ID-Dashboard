import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// PublicNode supports up to 50k block ranges for eth_getLogs.
export const readClient = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum.publicnode.com'),
})

// Block at which the RWA-ID contract first had activity.
// Narrows getLogs queries to avoid scanning irrelevant history.
export const CONTRACT_START_BLOCK = 24_540_000n

// Max blocks per getLogs request (PublicNode limit is 50k).
export const LOG_CHUNK_SIZE = 49_000n

// Fetch all logs for a given filter, chunked across the full range.
export async function getLogsChunked(filter) {
  const currentBlock = await readClient.getBlockNumber()
  const from = filter.fromBlock ?? CONTRACT_START_BLOCK
  const logs = []

  for (let start = from; start <= currentBlock; start += LOG_CHUNK_SIZE) {
    const end = start + LOG_CHUNK_SIZE - 1n > currentBlock
      ? currentBlock
      : start + LOG_CHUNK_SIZE - 1n

    const chunk = await readClient.getLogs({ ...filter, fromBlock: start, toBlock: end })
    logs.push(...chunk)
  }

  return logs
}
