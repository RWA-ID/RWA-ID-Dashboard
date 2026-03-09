import { useState, useEffect } from 'react'
import { RWAID_ADDRESS, RWAID_ABI } from '../lib/contracts'
import { readClient } from '../lib/readClient'
import ProjectDashboard from './ProjectDashboard'
import CreateProject from './CreateProject'
import { formatUnits } from 'viem'

export default function ProjectList({ address }) {
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [myProjects, setMyProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadProjects = async () => {
    if (!address) return
    setIsLoading(true)
    setLoadError('')
    try {
      // 1. Get total project count
      const nextId = await readClient.readContract({
        address: RWAID_ADDRESS,
        abi: RWAID_ABI,
        functionName: 'nextProjectId',
      })
      const total = Number(nextId) - 1
      if (total <= 0) { setMyProjects([]); setIsLoading(false); return }

      // 2. Read all projects in a single multicall
      const calls = Array.from({ length: total }, (_, i) => ({
        address: RWAID_ADDRESS,
        abi: RWAID_ABI,
        functionName: 'projects',
        args: [BigInt(i + 1)],
      }))

      const results = await readClient.multicall({ contracts: calls, allowFailure: true })

      // 3. Filter by owner (multicall returns array for multi-output functions)
      const FIELDS = ['owner', 'slug', 'slugHash', 'treasury', 'claimFee', 'transferable', 'merkleRoot', 'active', 'totalClaimed', 'totalRevenue']
      const owned = results
        .map((r, i) => {
          if (!r.result) return null
          const arr = Array.isArray(r.result) ? r.result : Object.values(r.result)
          const data = Object.fromEntries(FIELDS.map((k, j) => [k, arr[j]]))
          return { id: i + 1, data }
        })
        .filter(p => p && p.data?.owner?.toLowerCase() === address.toLowerCase())

      setMyProjects(owned)
    } catch (err) {
      console.error('loadProjects error:', err)
      setLoadError(err.message || 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [address])

  if (selected) {
    const project = myProjects.find(p => p.id === selected)
    return (
      <ProjectDashboard
        projectId={selected}
        project={project?.data}
        onBack={() => { setSelected(null); loadProjects() }}
        onRefresh={loadProjects}
      />
    )
  }

  if (creating) {
    return (
      <CreateProject
        address={address}
        onBack={() => setCreating(false)}
        onSuccess={() => { setCreating(false); loadProjects() }}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-['Syne'] text-2xl font-800 text-white mb-1">Your Projects</h1>
          <p className="text-white/40 text-sm">Select a project to manage it.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-5 py-2.5 bg-[#3d7fff] hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
        >
          <span className="text-base">+</span> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm">Loading projects...</p>
        </div>
      ) : loadError ? (
        <div className="text-center py-20 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <p className="text-red-400 text-sm mb-4">{loadError}</p>
          <button
            onClick={loadProjects}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      ) : myProjects.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-white font-semibold mb-2">No projects found</p>
          <p className="text-white/40 text-sm mb-6">
            This wallet hasn't created any RWA-ID projects yet.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="px-6 py-2.5 bg-[#3d7fff] hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            + Create First Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {myProjects.map(({ id, data: p }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className="w-full text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400 font-['Syne'] font-800 text-lg">
                    #{id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-lg">{p.slug}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.active
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {p.active ? 'Active' : 'Paused'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.transferable
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-white/5 text-white/30 border border-white/10'
                      }`}>
                        {p.transferable ? 'Transferable' : 'Soulbound'}
                      </span>
                    </div>
                    <p className="text-white/40 text-sm font-mono">{p.slug}.rwa-id.eth</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-white font-semibold">{p.totalClaimed.toString()}</p>
                    <p className="text-white/30 text-xs">claimed</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-semibold">
                      ${formatUnits(p.claimFee > 0n ? p.claimFee : 500000n, 6)}
                    </p>
                    <p className="text-white/30 text-xs">fee</p>
                  </div>
                  <span className="text-white/20 group-hover:text-blue-400 transition-colors text-lg">→</span>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={loadProjects}
            className="w-full py-2 text-white/20 hover:text-white/50 text-xs transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  )
}
