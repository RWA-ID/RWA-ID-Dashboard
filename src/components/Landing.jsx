import { useState, useEffect } from 'react'
import '../landing.css'
import WalkthroughModal from './WalkthroughModal'
import {
  NetworkEthereum, NetworkBase, NetworkArbitrumOne,
  NetworkOptimism, NetworkPolygon, NetworkLinea,
} from '@web3icons/react'

// real blockchain icons shown in the verification console (resolves on all chains)
const NETWORK_ICONS = [
  { Icon: NetworkEthereum,   name: 'Ethereum' },
  { Icon: NetworkBase,       name: 'Base' },
  { Icon: NetworkArbitrumOne, name: 'Arbitrum' },
  { Icon: NetworkOptimism,   name: 'Optimism' },
  { Icon: NetworkPolygon,    name: 'Polygon' },
  { Icon: NetworkLinea,      name: 'Linea' },
]

const DOCS_URL      = 'https://www.notion.so/RWA-ID-Technical-Overview-Reference-Implementation-v2-4563759f55214aa7989dbb882ef08e47'
const GITHUB_URL    = 'https://github.com/RWA-ID/RWA-ID'
const WHITEPAPER_URL = 'https://github.com/RWA-ID/RWA-ID/blob/main/whitepaper.md'
const REGISTRY_URL  = 'https://etherscan.io/address/0xD0B565C7134bDB16Fc3b8A9Cb5fdA003C37930c2'
const RESOLVER_URL  = 'https://etherscan.io/address/0x765FB675AC33a85ccb455d4cb0b5Fb1f2D345eb1'
const GATEWAY_URL   = 'https://gateway.rwa-id.com'

// ── Data ──────────────────────────────────────────────────────────────────────

const DOMAINS = [
  'joe.test.rwa-id.eth',
  'apollo.rwa-id.eth',
  'vanguard.test.rwa-id.eth',
  'blackrock.rwa-id.eth',
  'nomura.test.rwa-id.eth',
]

const WALLETS = [
  { name: 'MetaMask',        bg: 'linear-gradient(135deg,#f6851b,#e2761b)', letter: 'M' },
  { name: 'Trust Wallet',    bg: 'linear-gradient(135deg,#3375bb,#1e5fa3)', letter: 'T' },
  { name: 'Rainbow',         bg: 'linear-gradient(135deg,#ff4000,#ffb800 40%,#00aaff 70%,#7a5cff)', letter: 'R' },
  { name: 'Coinbase Wallet', bg: '#0052ff', letter: 'C' },
  { name: 'Ledger',          bg: '#000', letter: 'L' },
  { name: 'Trezor',          bg: 'linear-gradient(135deg,#111,#444)', letter: 'T' },
  { name: 'Rabby',           bg: 'linear-gradient(135deg,#7084ff,#5c6eff)', letter: 'R' },
  { name: 'Safe',            bg: '#12ff80', letter: 'S', colorText: '#111' },
  { name: 'Frame',           bg: '#111', letter: 'F' },
  { name: 'WalletConnect',   bg: '#3b99fc', letter: 'W' },
]

const CHAINS = [
  { name: 'Ethereum',  bg: '#627eea', letter: '⟠' },
  { name: 'Base',      bg: '#0052ff', letter: 'B' },
  { name: 'Polygon',   bg: 'linear-gradient(135deg,#8247e5,#6f34d0)', letter: '◆' },
  { name: 'Arbitrum',  bg: '#28a0f0', letter: 'A' },
  { name: 'Optimism',  bg: '#ff0420', letter: 'O' },
  { name: 'Linea',     bg: '#121212', letter: 'L' },
  { name: 'zkSync',    bg: '#1e69ff', letter: 'Z' },
  { name: 'Scroll',    bg: '#ffeeda', letter: 'S', colorText: '#111' },
  { name: 'Mantle',    bg: '#000',    letter: 'M' },
  { name: 'Avalanche', bg: '#e84142', letter: 'A' },
  { name: 'BNB Chain', bg: '#f0b90b', letter: 'B', colorText: '#111' },
  { name: 'Gnosis',    bg: '#0c423a', letter: 'G' },
]

const SNIPPETS = {
  viem: (
    <>
      <span className="tk-cm">{'// Resolve an RWA-ID across any supported chain'}</span>{'\n\n'}
      <span className="tk-kw">import </span><span className="tk-pn">{'{ '}</span><span className="tk-var">createPublicClient</span><span className="tk-pn">, </span><span className="tk-var">http</span><span className="tk-pn">{' } '}</span><span className="tk-kw">from</span><span className="tk-str"> 'viem'</span>{'\n'}
      <span className="tk-kw">import </span><span className="tk-pn">{'{ '}</span><span className="tk-var">base</span><span className="tk-pn">{' } '}</span><span className="tk-kw">from</span><span className="tk-str"> 'viem/chains'</span>{'\n\n'}
      <span className="tk-kw">const </span><span className="tk-var">client</span><span className="tk-pn"> = </span><span className="tk-fn">createPublicClient</span><span className="tk-pn">{'({'}</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-var">chain</span><span className="tk-pn">: </span><span className="tk-var">base</span><span className="tk-pn">,</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-var">transport</span><span className="tk-pn">: </span><span className="tk-fn">http</span><span className="tk-pn">(),</span>{'\n'}
      <span className="tk-pn">{'})'}</span>{'\n\n'}
      <span className="tk-kw">const </span><span className="tk-var">address</span><span className="tk-pn"> = </span><span className="tk-kw">await </span><span className="tk-var">client</span><span className="tk-pn">.</span><span className="tk-fn">getEnsAddress</span><span className="tk-pn">({'{'}</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-var">name</span><span className="tk-pn">: </span><span className="tk-str">'joe.test.rwa-id.eth'</span><span className="tk-pn">,</span>{'\n'}
      <span className="tk-pn">{'})'}</span>
    </>
  ),
  ethers: (
    <>
      <span className="tk-cm">{'// Resolve an RWA-ID with ethers.js'}</span>{'\n\n'}
      <span className="tk-kw">import </span><span className="tk-pn">{'{ '}</span><span className="tk-var">JsonRpcProvider</span><span className="tk-pn">{' } '}</span><span className="tk-kw">from</span><span className="tk-str"> 'ethers'</span>{'\n\n'}
      <span className="tk-kw">const </span><span className="tk-var">provider</span><span className="tk-pn"> = </span><span className="tk-kw">new </span><span className="tk-fn">JsonRpcProvider</span><span className="tk-pn">(</span><span className="tk-str">'https://base.rpc'</span><span className="tk-pn">)</span>{'\n\n'}
      <span className="tk-kw">const </span><span className="tk-var">address</span><span className="tk-pn"> = </span><span className="tk-kw">await </span><span className="tk-var">provider</span><span className="tk-pn">.</span><span className="tk-fn">resolveName</span><span className="tk-pn">(</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-str">'joe.test.rwa-id.eth'</span>{'\n'}
      <span className="tk-pn">)</span>
    </>
  ),
  wagmi: (
    <>
      <span className="tk-cm">{'// Resolve an RWA-ID from a React component'}</span>{'\n\n'}
      <span className="tk-kw">import </span><span className="tk-pn">{'{ '}</span><span className="tk-var">useEnsAddress</span><span className="tk-pn">{' } '}</span><span className="tk-kw">from</span><span className="tk-str"> 'wagmi'</span>{'\n\n'}
      <span className="tk-kw">const </span><span className="tk-pn">{'{ '}</span><span className="tk-var">data</span><span className="tk-pn">: </span><span className="tk-var">address</span><span className="tk-pn">{' } = '}</span><span className="tk-fn">useEnsAddress</span><span className="tk-pn">({'{'}</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-var">name</span><span className="tk-pn">: </span><span className="tk-str">'joe.test.rwa-id.eth'</span><span className="tk-pn">,</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-var">chainId</span><span className="tk-pn">: </span><span className="tk-num">8453</span><span className="tk-pn">, </span><span className="tk-cm">{'// Base'}</span>{'\n'}
      <span className="tk-pn">{'})'}</span>
    </>
  ),
}

// ── Fingerprint ───────────────────────────────────────────────────────────────

function FingerprintBiometric() {
  return (
    <>
      <svg className="fp" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M100 25c-32 0-56 24-56 56v36c0 12 4 22 10 30"/>
        <path d="M100 40c-24 0-42 18-42 42v38c0 16 4 28 11 38"/>
        <path d="M100 55c-16 0-28 12-28 28v42c0 22 6 36 14 48" strokeOpacity=".9"/>
        <path d="M100 70c-8 0-14 6-14 14v50c0 26 8 42 16 54" strokeOpacity=".8"/>
        <path d="M100 85v54c0 28 6 42 12 54" strokeOpacity=".7"/>
        <path d="M114 82c0-8-6-14-14-14s-14 6-14 14" strokeOpacity=".9"/>
        <path d="M128 95c0-16-12-28-28-28" strokeOpacity=".85"/>
        <path d="M142 110c0-24-18-42-42-42" strokeOpacity=".7"/>
        <path d="M156 130c0-32-24-56-56-56" strokeOpacity=".55"/>
      </svg>
      <div className="fp-sweep"/>
    </>
  )
}

function FingerprintContours() {
  const rings = Array.from({ length: 12 }, (_, i) => ({ r: 14 + i * 12, o: (1 - i / 14).toFixed(2) }))
  return (
    <div className="fp-contours">
      <svg viewBox="0 0 200 200" fill="none">
        {rings.map(({ r, o }, i) => (
          <circle key={i} cx="100" cy="100" r={r} stroke="var(--ink-2)" strokeWidth="1" strokeOpacity={o} fill="none"/>
        ))}
        <circle cx="100" cy="100" r="4" fill="var(--accent)"/>
        <path d="M60 100a40 40 0 0 1 80 0" stroke="var(--accent)" strokeWidth="1.2" opacity=".4"/>
        <path d="M75 100a25 25 0 0 1 50 0" stroke="var(--accent)" strokeWidth="1.2" opacity=".6"/>
      </svg>
      <div className="fp-sweep"/>
    </div>
  )
}

function FingerprintTokens() {
  const [hotIdx, setHotIdx] = useState(0)
  const samples = [
    'alpha.test.rwa-id.eth','vanguard.rwa-id.eth','tresor.test.rwa-id.eth',
    'aria.rwa-id.eth','lloyd.test.rwa-id.eth','helios.rwa-id.eth',
    'kyber.rwa-id.eth','citi.test.rwa-id.eth','nomura.rwa-id.eth',
    'apollo.rwa-id.eth','apex.test.rwa-id.eth','sigma.rwa-id.eth',
    'orion.test.rwa-id.eth','atlas.rwa-id.eth','vega.rwa-id.eth',
    'nexus.test.rwa-id.eth','delta.rwa-id.eth','omega.test.rwa-id.eth',
    'prime.rwa-id.eth','axis.rwa-id.eth','lux.test.rwa-id.eth',
    'node.rwa-id.eth','quorum.rwa-id.eth','pilot.test.rwa-id.eth',
  ]
  const ringDefs = [{ r: 22, n: 6 }, { r: 46, n: 10 }, { r: 72, n: 14 }, { r: 100, n: 20 }]
  const tokens = []
  let idx = 0
  for (const ring of ringDefs) {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 + ring.r * 0.02
      const x = 50 + (ring.r / 2.2) * Math.cos(a)
      const y = 50 + (ring.r / 2.2) * Math.sin(a)
      const rot = ((a * 180) / Math.PI + 90).toFixed(0)
      tokens.push({ s: samples[idx % samples.length], x, y, rot, idx })
      idx++
    }
  }
  useEffect(() => {
    const id = setInterval(() => setHotIdx(Math.floor(Math.random() * tokens.length)), 350)
    return () => clearInterval(id)
  }, [tokens.length])
  return (
    <div className="fp-tokens">
      {tokens.map((t, i) => (
        <span key={i} className={`token${i === hotIdx ? ' hot' : ''}`}
          style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `translate(-50%,-50%) rotate(${t.rot}deg)` }}>
          {t.s}
        </span>
      ))}
    </div>
  )
}

// ── Marquee ───────────────────────────────────────────────────────────────────

function Marquee({ data, reverse = false }) {
  const doubled = [...data, ...data]
  return (
    <div className={`marquee${reverse ? ' marquee-rev' : ''}`}>
      <div className="marquee-track">
        {doubled.map((d, i) => (
          <div key={i} className="m-chip">
            <span className="m-chip-icon" style={{ background: d.bg, color: d.colorText ?? '#fff' }}>
              {d.letter}
            </span>
            {d.name}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── iMac frame — an RWA platform verification console resolving a client ID ────

function ImacFrame() {
  const FULL = 'joe.test.rwa-id.eth'
  const [typed, setTyped] = useState('')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timers = []
    const at = (fn, ms) => timers.push(setTimeout(() => { if (!cancelled) fn() }, ms))

    function run() {
      setTyped('')
      setVerified(false)
      let i = 0
      const typeNext = () => {
        i++
        setTyped(FULL.slice(0, i))
        if (i < FULL.length) at(typeNext, 95)
        else {
          at(() => setVerified(true), 480)
          at(run, 3400)            // hold, then loop
        }
      }
      at(typeNext, 700)            // initial pause before typing
    }
    run()
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [])

  return (
    <div className="imac">
      <div className="imac-body">
        <div className="imac-screen">
          <div className="vc">
            <div className="vc-bar">
              <span className="vc-brand">
                <span className="vc-mark">R</span>RWA-ID
                <span className="vc-sub">Verification Console</span>
              </span>
              <span className="vc-live"><span className="vc-live-dot"/>Live</span>
            </div>
            <div className="vc-body">
              <div className="vc-label">Verify client identity</div>
              <div className="vc-search">
                <svg className="vc-ico" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3" strokeLinecap="round"/></svg>
                <span className="vc-name">{typed}</span>
                {!verified && <span className="vc-caret"/>}
              </div>
              <div className={`vc-result${verified ? ' show' : ''}`}>
                <span className="vc-ava"/>
                <div className="vc-info">
                  <span className="vc-addr">0x4a91…3c2f</span>
                  <span className="vc-meta">KYC attested · verified client wallet</span>
                </div>
                <span className="vc-badge" aria-label="verified">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5l2.5 2.5L11 4"/></svg>
                  Verified
                </span>
              </div>
              <div className="vc-chains">
                <span className="vc-chains-label">Resolves on</span>
                <div className="vc-dots">
                  {NETWORK_ICONS.map(({ Icon, name }, i) => (
                    <span key={i} className="vc-dot" title={name}>
                      <Icon variant="branded" size={14}/>
                    </span>
                  ))}
                </div>
                <span className="vc-chains-all">all networks</span>
              </div>
            </div>
          </div>
        </div>
        <div className="imac-chin">RWA-ID</div>
      </div>
      <div className="imac-neck"/>
      <div className="imac-base"/>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Landing({ onConnect }) {
  const [domainIdx, setDomainIdx]       = useState(0)
  const [domainVisible, setDomainVisible] = useState(true)
  const [codeLang, setCodeLang]         = useState('viem')
  const [copied, setCopied]             = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setDomainVisible(false)
      setTimeout(() => { setDomainIdx(i => (i + 1) % DOMAINS.length); setDomainVisible(true) }, 220)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  const handleCopy = () => {
    const text = {
      viem:   `// Resolve an RWA-ID across any supported chain\n\nimport { createPublicClient, http } from 'viem'\nimport { base } from 'viem/chains'\n\nconst client = createPublicClient({\n  chain: base,\n  transport: http(),\n})\n\nconst address = await client.getEnsAddress({\n  name: 'joe.test.rwa-id.eth',\n})`,
      ethers: `// Resolve an RWA-ID with ethers.js\n\nimport { JsonRpcProvider } from 'ethers'\n\nconst provider = new JsonRpcProvider('https://base.rpc')\n\nconst address = await provider.resolveName(\n  'joe.test.rwa-id.eth'\n)`,
      wagmi:  `// Resolve an RWA-ID from a React component\n\nimport { useEnsAddress } from 'wagmi'\n\nconst { data: address } = useEnsAddress({\n  name: 'joe.test.rwa-id.eth',\n  chainId: 8453, // Base\n})`,
    }
    navigator.clipboard?.writeText(text[codeLang])
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="landing-root">
      {showWalkthrough && <WalkthroughModal onClose={() => setShowWalkthrough(false)} />}

      {/* ── Nav ── */}
      <header className="l-nav">
        <a className="brand" href="#">
          <span className="brand-mark">R</span>
          <span className="brand-name">RWA-ID</span>
        </a>
        <nav className="nav-links">
          <a href={DOCS_URL} target="_blank" rel="noreferrer">Docs</a>
          <a href={WHITEPAPER_URL} target="_blank" rel="noreferrer">Whitepaper</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <div className="nav-right">
          <button className="nav-signin" onClick={() => setShowWalkthrough(true)}>Contact</button>
          <button className="nav-connect" onClick={onConnect}>
            Connect wallet
          </button>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="dot"/>
              On-chain
              <span className="sep">·</span>
              ENS-compatible
              <span className="sep">·</span>
              ERC-721
            </div>
            <h1 className="headline">
              Identity Infrastructure<br/>
              for <span className="headline-accent">Real-World Assets</span>
            </h1>
            <p className="hero-sub">
              Issue, manage, and revoke auditable cross-chain identities for institutional
              clients. One ENS subdomain, resolvable on every network, minted as a verifiable
              ERC-721 — with zero custody of personal data.
            </p>
            <div className="cta-row">
              <button className="btn-hero-primary" onClick={onConnect}>
                Connect to manage identities
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              </button>
              <a className="btn-hero-ghost" href={DOCS_URL} target="_blank" rel="noreferrer">
                View the protocol
              </a>
            </div>
            <div className="hero-meta">
              <span className="hero-meta-live">
                <span className="dot"/>
                mainnet live
              </span>
              <span className="hero-meta-sep"/>
              <span>audit in progress</span>
              <span className="hero-meta-sep"/>
              <span>v2 · ERC-721</span>
            </div>
          </div>

          <div className="hero-visual">
            <ImacFrame/>
          </div>
        </section>

        {/* ── Bento grid ── */}
        <section className="bento">
          <div className="bento-grid">

            {/* 01 — Identity Registry */}
            <article className="b-card b-card-registry">
              <div className="b-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">01</span>
                  <span className="eyebrow-label">Identity Registry</span>
                </div>
                <span className="b-chip">ERC-721 · ENS node</span>
              </div>

              <div className="fingerprint-stage">
                <FingerprintContours/>
              </div>

              <div className="domain-pill">
                <span className="pill-live">
                  <span className="pill-live-dot"/>live
                </span>
                <span className="pill-domain" style={{ opacity: domainVisible ? 1 : 0 }}>
                  {DOMAINS[domainIdx]}
                </span>
                <span className="pill-token">#0x4a91…</span>
              </div>

              <div className="b-body">
                <h3>Every identity is a token.</h3>
                <p>Each issued subdomain becomes an ERC-721 ENS node — transferable by policy, revocable by issuer, and fully auditable on-chain. No off-chain registry, no black boxes.</p>
              </div>
            </article>

            {/* 02 — Zero-Touch Privacy */}
            <article className="b-card">
              <div className="b-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">02</span>
                  <span className="eyebrow-label">Zero-Touch Privacy</span>
                </div>
              </div>

              <div className="privacy-diagram" aria-hidden="true">
                <div className="privacy-node">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M9 1.5v6M9 10.5v.01M1.5 16.5h15L9 3 1.5 16.5z" strokeLinejoin="round"/>
                  </svg>
                  <span>KYC provider</span>
                </div>
                <div className="privacy-wire">
                  <div className="privacy-wire-dash"/>
                </div>
                <div className="privacy-node privacy-rwa">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <circle cx="9" cy="9" r="6.5"/><circle cx="9" cy="9" r="2" fill="currentColor"/>
                  </svg>
                  <span>RWA-ID</span>
                </div>
                <div className="privacy-blocked">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="7" cy="7" r="6"/><path d="M3 11L11 3"/>
                  </svg>
                  <span>no PII transit</span>
                </div>
              </div>

              <div className="b-body">
                <h3>We never touch KYC.</h3>
                <p>Your compliance partner verifies; we mint. Personal data stays where it was attested — the chain records only the cryptographic fact.</p>
              </div>
            </article>

            {/* 03 — Wallets */}
            <article className="b-card">
              <div className="b-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">03</span>
                  <span className="eyebrow-label">Compatible Client Wallets</span>
                </div>
              </div>
              <Marquee data={WALLETS}/>
              <div className="b-body">
                <h3>Works in every wallet your clients already use.</h3>
                <p>Standard ENS resolution — no extensions, no proprietary SDK. If it signs EIP-191, it resolves an RWA-ID.</p>
              </div>
            </article>

            {/* 04 — Cross-chain */}
            <article className="b-card">
              <div className="b-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">04</span>
                  <span className="eyebrow-label">Cross-Chain via CCIP Read</span>
                </div>
              </div>
              <Marquee data={CHAINS} reverse/>
              <div className="b-body">
                <h3>One identity. Every chain.</h3>
                <p>CCIP Read (EIP-3668) resolves the same subdomain on Ethereum, Base, Polygon, Arbitrum, Optimism, Linea and more — with cryptographic proofs, not bridges.</p>
              </div>
            </article>

            {/* 05 — Code snippet */}
            <article className="b-card b-card-code">
              <div className="b-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">05</span>
                  <span className="eyebrow-label">Drop-in Integration</span>
                </div>
              </div>

              <div className="code-window">
                <div className="code-tabs">
                  {['viem','ethers','wagmi'].map(lang => (
                    <button key={lang} className={`code-tab${codeLang === lang ? ' is-active' : ''}`} onClick={() => setCodeLang(lang)}>
                      {lang}
                    </button>
                  ))}
                  <button className={`code-copy${copied ? ' is-copied' : ''}`} onClick={handleCopy}>
                    <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M2 8.5V2.5a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.1"/>
                    </svg>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="code-body"><code>{SNIPPETS[codeLang]}</code></pre>
              </div>

              <div className="b-body">
                <h3>Resolve in three lines.</h3>
                <p>Works with viem, ethers.js, and wagmi. Any ENS-compatible resolution call — no proprietary client required.</p>
              </div>
            </article>

          </div>
        </section>

        {/* ── Stats ── */}
        <section className="l-stats">
          <div className="l-stats-inner">
            <div className="l-stat">
              <div className="l-stat-num">10<span className="plus">+</span></div>
              <div className="l-stat-label">Supported Networks</div>
            </div>
            <div className="l-stat">
              <div className="l-stat-num" style={{ fontSize: 28 }}>ERC-721</div>
              <div className="l-stat-label">Token Standard</div>
            </div>
            <div className="l-stat">
              <div className="l-stat-num" style={{ fontSize: 28 }}>CCIP Read</div>
              <div className="l-stat-label">Resolution Protocol</div>
            </div>
            <div className="l-stat">
              <div className="l-stat-num">ENS</div>
              <div className="l-stat-label">Identity Layer</div>
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="footer-cta">
          <div className="fc-eyebrow">Ready when your compliance team is.</div>
          <h2 className="fc-headline">
            Mint your first <span className="headline-accent">institutional identity</span>.
          </h2>
          <div className="cta-row">
            <button className="btn-hero-primary" onClick={onConnect}>
              Connect to manage identities
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </button>
            <button className="btn-hero-ghost" onClick={() => setShowWalkthrough(true)}>
              Book a walkthrough
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="l-footer">
          <div className="l-footer-inner">
            <div className="l-footer-brand">
              <div className="brand-name">RWA-ID</div>
              <div className="tagline">Identity infrastructure for regulated on-chain finance.</div>
            </div>
            <div className="l-footer-cols">
              <div className="l-footer-col">
                <div className="l-footer-col-head">Protocol</div>
                <a href={REGISTRY_URL} target="_blank" rel="noreferrer">Registry contract</a>
                <a href={RESOLVER_URL} target="_blank" rel="noreferrer">Resolver contract</a>
                <a href={GATEWAY_URL} target="_blank" rel="noreferrer">CCIP Gateway</a>
              </div>
              <div className="l-footer-col">
                <div className="l-footer-col-head">Developers</div>
                <a href={DOCS_URL} target="_blank" rel="noreferrer">Technical docs</a>
                <a href={WHITEPAPER_URL} target="_blank" rel="noreferrer">Whitepaper</a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
                <a href={`${REGISTRY_URL}#code`} target="_blank" rel="noreferrer">Verified contracts</a>
              </div>
              <div className="l-footer-col">
                <div className="l-footer-col-head">Company</div>
                <button onClick={() => setShowWalkthrough(true)} style={{ background: 'none', border: 0, padding: 0, fontSize: 13.5, color: 'var(--ink-3)', cursor: 'pointer', textAlign: 'left', transition: 'color .15s', fontFamily: 'var(--f-sans)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}>
                  Contact / Walkthrough
                </button>
                <a href={`mailto:hello@rwa-id.com`}>hello@rwa-id.com</a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">Security disclosures</a>
              </div>
            </div>
          </div>
          <div className="l-footer-bottom">
            <span>© 2026 RWA-ID Labs</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href={REGISTRY_URL} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--f-mono)', color: 'var(--ink-5)' }}>
                0xD0B5…930c2
              </a>
              <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--ink-5)' }}>rwa-id.eth</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
