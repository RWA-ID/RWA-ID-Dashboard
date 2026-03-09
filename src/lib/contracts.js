export const RWAID_ADDRESS = '0xD0B565C7134bDB16Fc3b8A9Cb5fdA003C37930c2'

export const RWAID_ABI = [
  // ── View ────────────────────────────────────────────────────────────────
  {
    name: 'nextProjectId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'projects',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'slug', type: 'string' },
      { name: 'slugHash', type: 'bytes32' },
      { name: 'treasury', type: 'address' },
      { name: 'claimFee', type: 'uint256' },
      { name: 'transferable', type: 'bool' },
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'active', type: 'bool' },
      { name: 'totalClaimed', type: 'uint256' },
      { name: 'totalRevenue', type: 'uint256' },
    ],
  },
  {
    name: 'tokenMetadata',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'nameHash', type: 'bytes32' },
      { name: 'claimedAt', type: 'uint256' },
    ],
  },
  {
    name: 'minimumClaimFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'nameNodeFromHash',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'projectId', type: 'uint256' }, { name: 'nameHash_', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'nodeToTokenId',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'nodeClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'revoked',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'projectId', type: 'uint256' }, { name: 'nameHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  // ── Project Owner Actions ────────────────────────────────────────────────
  {
    name: 'updateMerkleRoot',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'newRoot', type: 'bytes32' },
      { name: 'newTotalAllowlisted', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'updateClaimFee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'newFee', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'updateTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'newTreasury', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'setProjectTransferable',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'transferable_', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'setTokenTransferable',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'transferable_', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'pauseProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'projectId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'unpauseProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'projectId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'transferProjectOwnership',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'newOwner', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'revokeIdentity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  // ── Events ────────────────────────────────────────────────────────────────
  {
    name: 'ProjectCreated',
    type: 'event',
    inputs: [
      { name: 'projectId', type: 'uint256', indexed: true },
      { name: 'slug', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'treasury', type: 'address', indexed: false },
      { name: 'claimFee', type: 'uint256', indexed: false },
      { name: 'transferable', type: 'bool', indexed: false },
    ],
  },
  {
    name: 'IdentityClaimed',
    type: 'event',
    inputs: [
      { name: 'projectId', type: 'uint256', indexed: true },
      { name: 'nameHash', type: 'bytes32', indexed: true },
      { name: 'claimer', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'node', type: 'bytes32', indexed: false },
      { name: 'feePaid', type: 'uint256', indexed: false },
    ],
  },
]
