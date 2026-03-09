import { useAccount, useDisconnect } from 'wagmi'
import { modal } from './lib/wagmi'
import ProjectList from './components/ProjectList'

import NetworkEthereum from '@web3icons/react/icons/networks/NetworkEthereum'
import NetworkBase from '@web3icons/react/icons/networks/NetworkBase'
import NetworkPolygon from '@web3icons/react/icons/networks/NetworkPolygon'
import NetworkOptimism from '@web3icons/react/icons/networks/NetworkOptimism'
import NetworkArbitrumOne from '@web3icons/react/icons/networks/NetworkArbitrumOne'
import NetworkAvalanche from '@web3icons/react/icons/networks/NetworkAvalanche'
import NetworkLinea from '@web3icons/react/icons/networks/NetworkLinea'
import NetworkCelo from '@web3icons/react/icons/networks/NetworkCelo'
import NetworkGnosis from '@web3icons/react/icons/networks/NetworkGnosis'
import NetworkAbstract from '@web3icons/react/icons/networks/NetworkAbstract'

import WalletMetamask from '@web3icons/react/icons/wallets/WalletMetamask'
import WalletTrust from '@web3icons/react/icons/wallets/WalletTrust'
import WalletRainbow from '@web3icons/react/icons/wallets/WalletRainbow'
import WalletCoinbase from '@web3icons/react/icons/wallets/WalletCoinbase'
import WalletLedger from '@web3icons/react/icons/wallets/WalletLedger'
import WalletTrezor from '@web3icons/react/icons/wallets/WalletTrezor'

function FingerprintSVG({ size = 24, color = '#3d7fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13.5" r="1" fill={color} />
      <path d="M10 14.5 C10 11 14 11 14 14.5" stroke={color} strokeWidth="1.3" />
      <path d="M10 14.5 Q12 17 14 14.5" stroke={color} strokeWidth="1.3" />
      <path d="M8 16 C8 8 16 8 16 16" stroke={color} strokeWidth="1.2" />
      <path d="M8 16 Q12 19.5 16 16" stroke={color} strokeWidth="1.2" />
      <path d="M6 17.5 C6 5 18 5 18 17.5" stroke={color} strokeWidth="1.1" />
      <path d="M6 17.5 Q12 21.5 18 17.5" stroke={color} strokeWidth="1.1" />
      <path d="M4 19.5 C4 2 20 2 20 19.5" stroke={color} strokeWidth="1" opacity="0.8" />
      <path d="M4 19.5 Q12 23.5 20 19.5" stroke={color} strokeWidth="1" opacity="0.8" />
      <path d="M2.5 21.5 C2.5 0 21.5 0 21.5 21.5" stroke={color} strokeWidth="0.9" opacity="0.5" />
    </svg>
  )
}

// Uniswap Wallet — not in @web3icons/react, using official brand SVG
function UniswapWalletIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="22" fill="#FF007A" />
      <path d="M35.5 28c-1.2.2-3.5 1.5-4.6 2.8-1.7 2-2.4 4.1-2.4 7.2 0 2.5.4 4 1.8 6.3 1 1.7 1 1.8.4 2.8-.8 1.4-1 3.5-.5 5.1.5 1.5 2.2 3.4 3.8 4.2l1.2.6-.3 1.3c-.5 2-.3 4.8.5 6.5 1 2.3 3.4 4.4 6.1 5.4 1.6.6 5.5.8 7.4.4 3.5-.8 6.6-3.4 7.8-6.6.4-.9.5-1.6.5-3.6 0-2.7-.4-4.2-1.6-5.7l-.7-.8.9-.5c2.3-1.4 3.7-4 3.7-7 0-2-.4-3.4-1.6-5.2-.7-1-1.9-2.2-2.3-2.2-.1 0-.1.3 0 .8.4 1.9.2 4.1-.5 5.7-.9 2.1-2.8 3.8-4.8 4.4l-.9.3-.4-.8c-.8-1.5-2.4-3.2-3.9-4.1-1-.6-1.1-.7-.8-1.1.8-1.4 1-3.8.4-5.6-.8-2.7-3-5-5.6-5.7-1.2-.3-3.6-.4-4.5-.1z" fill="white" />
    </svg>
  )
}

const NETWORKS = [
  { name: 'Ethereum',  Icon: NetworkEthereum },
  { name: 'Base',      Icon: NetworkBase },
  { name: 'Polygon',   Icon: NetworkPolygon },
  { name: 'Optimism',  Icon: NetworkOptimism },
  { name: 'Arbitrum',  Icon: NetworkArbitrumOne },
  { name: 'Avalanche', Icon: NetworkAvalanche },
  { name: 'Linea',     Icon: NetworkLinea },
  { name: 'Celo',      Icon: NetworkCelo },
  { name: 'Gnosis',    Icon: NetworkGnosis },
  { name: 'Abstract',  Icon: NetworkAbstract },
]

const WALLETS = [
  { name: 'MetaMask',       Icon: WalletMetamask },
  { name: 'Trust Wallet',   Icon: WalletTrust },
  { name: 'Rainbow',        Icon: WalletRainbow },
  { name: 'Coinbase Wallet',Icon: WalletCoinbase },
  { name: 'Ledger',         Icon: WalletLedger },
  { name: 'Trezor',         Icon: WalletTrezor },
  { name: 'Uniswap Wallet', Icon: null }, // custom SVG
]

const FEATURES = [
  'Allowlist Management',
  'Claim Fee Control',
  'Treasury Routing',
  'Cross-Chain CCIP Read',
  'Token Revocation',
  'Transferability Control',
]

function IconRow({ items, size = 48 }) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {items.map(({ name, Icon }) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10 hover:ring-white/25 hover:scale-105 transition-all duration-200">
            {Icon
              ? <Icon size={size} variant="branded" />
              : <UniswapWalletIcon size={size} />
            }
          </div>
          <span className="text-white/35 text-[10px] tracking-wide text-center leading-tight max-w-[56px]">{name}</span>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const handleDisconnect = async () => {
    try { await modal.disconnect() } catch {}
    try { disconnect() } catch {}
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#0b1120]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FingerprintSVG size={22} />
          </div>
          <span className="font-['Syne'] font-800 text-lg text-white tracking-tight">
            RWA-ID <span className="text-[#3d7fff]">Dashboard</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <span className="text-sm text-white/40 font-mono hidden sm:block">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm border border-white/10 rounded-lg text-white/50 hover:border-white/20 hover:text-white transition-all"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => modal.open()}
              className="px-5 py-2 bg-[#3d7fff] hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {isConnected ? (
          <ProjectList address={address} />
        ) : (
          <div className="flex flex-col items-center text-center">

            {/* Hero */}
            <h1 className="font-['Syne'] text-4xl sm:text-5xl font-800 text-white leading-tight max-w-2xl mb-5">
              Enterprise Identity Infrastructure{' '}
              <span className="text-[#3d7fff]">for Real-World Assets</span>
            </h1>
            <p className="text-white/40 max-w-lg text-base leading-relaxed mb-3">
              Issue, manage, and revoke verified on-chain identities for your institutional clients.
              Built for regulated RWA platforms requiring auditable, cross-chain identity control.
            </p>
            <p className="text-white/25 max-w-md text-sm leading-relaxed mb-14">
              Each identity is a soulbound or transferable ERC-721 token — resolvable across any
              EVM chain via ENS wildcard and CCIP Read without bridging assets.
            </p>

            {/* Fingerprint card + features */}
            <div className="flex flex-col sm:flex-row items-center gap-10 mb-16 w-full max-w-2xl">
              <div className="relative w-56 h-56 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3d7fff]/20 to-[#3d7fff]/5 rounded-3xl" />
                <div className="absolute inset-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#3d7fff]/10 flex items-center justify-center">
                    <FingerprintSVG size={38} />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[10px] text-white/30">yourproject.rwa-id.eth</p>
                    <p className="font-['Syne'] text-base font-semibold text-white mt-1">Identity Dashboard</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Soulbound on Ethereum</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-left">
                {FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3d7fff] flex-shrink-0" />
                    <span className="text-white/60 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported Networks */}
            <div className="w-full mb-12">
              <p className="text-white/20 text-[10px] uppercase tracking-widest mb-6">
                Cross-chain interoperability via CCIP Read
              </p>
              <IconRow items={NETWORKS} size={52} />
            </div>

            {/* Compatible Wallets */}
            <div className="w-full mb-14">
              <p className="text-white/20 text-[10px] uppercase tracking-widest mb-6">
                Compatible wallets
              </p>
              <IconRow items={WALLETS} size={52} />
            </div>

            {/* Stats */}
            <div className="flex gap-10">
              {[
                { label: 'Networks', value: '10+' },
                { label: 'Standard', value: 'ERC-721' },
                { label: 'Resolution', value: 'CCIP Read' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-['Syne'] text-2xl font-700 text-white">{s.value}</p>
                  <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
