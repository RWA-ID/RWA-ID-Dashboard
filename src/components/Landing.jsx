import { useState, useEffect, useRef } from 'react'
import '../landing.css'

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
  { name: 'Trezor',          bg: 'linear-gradient(135deg,#000,#444)', letter: 'T' },
  { name: 'Rabby',           bg: 'linear-gradient(135deg,#7084ff,#5c6eff)', letter: 'R' },
  { name: 'Safe',            bg: '#12ff80', letter: 'S', colorText: '#111' },
  { name: 'Frame',           bg: '#111', letter: 'F' },
  { name: 'WalletConnect',   bg: '#3b99fc', letter: 'W' },
]

const CHAINS = [
  { name: 'Ethereum', bg: '#627eea', letter: '⟠' },
  { name: 'Base',     bg: '#0052ff', letter: 'B' },
  { name: 'Polygon',  bg: 'linear-gradient(135deg,#8247e5,#6f34d0)', letter: '◆' },
  { name: 'Arbitrum', bg: '#28a0f0', letter: 'A' },
  { name: 'Optimism', bg: '#ff0420', letter: 'O' },
  { name: 'Linea',    bg: '#121212', letter: 'L' },
  { name: 'zkSync',   bg: '#1e69ff', letter: 'Z' },
  { name: 'Scroll',   bg: '#ffeeda', letter: 'S', colorText: '#111' },
  { name: 'Mantle',   bg: '#000', letter: 'M' },
  { name: 'Avalanche',bg: '#e84142', letter: 'A' },
  { name: 'BNB Chain',bg: '#f0b90b', letter: 'B', colorText: '#111' },
  { name: 'Gnosis',   bg: '#0c423a', letter: 'G' },
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
      <span className="tk-kw">const </span><span className="tk-var">address</span><span className="tk-pn"> = </span><span className="tk-kw">await </span><span className="tk-var">client</span><span className="tk-pn">.</span><span className="tk-fn">getEnsAddress</span><span className="tk-pn">{'({'}</span>{'\n'}
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
      <span className="tk-kw">const </span><span className="tk-pn">{'{ '}</span><span className="tk-var">data</span><span className="tk-pn">: </span><span className="tk-var">address</span><span className="tk-pn">{' } = '}</span><span className="tk-fn">useEnsAddress</span><span className="tk-pn">{'({'}</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-var">name</span><span className="tk-pn">: </span><span className="tk-str">'joe.test.rwa-id.eth'</span><span className="tk-pn">,</span>{'\n'}
      <span className="tk-pn">{'  '}</span><span className="tk-var">chainId</span><span className="tk-pn">: </span><span className="tk-num">8453</span><span className="tk-pn">, </span><span className="tk-cm">{'// Base'}</span>{'\n'}
      <span className="tk-pn">{'})'}</span>
    </>
  ),
}

// ── Fingerprint variants ──────────────────────────────────────────────────────

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
  const rings = Array.from({ length: 12 }, (_, i) => ({
    r: 14 + i * 12,
    o: (1 - i / 14).toFixed(2),
  }))
  return (
    <div className="fp-contours">
      <svg viewBox="0 0 200 200" fill="none" style={{ color: 'var(--blue-soft)' }}>
        {rings.map(({ r, o }, i) => (
          <circle key={i} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="1" strokeOpacity={o} fill="none"/>
        ))}
        <circle cx="100" cy="100" r="4" fill="#7aa6ff"/>
        <path d="M60 100a40 40 0 0 1 80 0" stroke="#7aa6ff" strokeWidth="1.2" opacity=".5"/>
        <path d="M75 100a25 25 0 0 1 50 0" stroke="#7aa6ff" strokeWidth="1.2" opacity=".7"/>
      </svg>
      <div className="fp-sweep" style={{ opacity: .4 }}/>
    </div>
  )
}

function FingerprintTokens() {
  const [hotIdx, setHotIdx] = useState(0)
  const samples = [
    'alpha.test.rwa-id.eth','vanguard.rwa-id.eth','tresor.test.rwa-id.eth',
    'aria.rwa-id.eth','lloyd.test.rwa-id.eth','blackrock.rwa-id.eth',
    'kyber.rwa-id.eth','citi.test.rwa-id.eth','nomura.rwa-id.eth',
    'apollo.rwa-id.eth','apex.test.rwa-id.eth','sigma.rwa-id.eth',
    'helios.rwa-id.eth','orion.test.rwa-id.eth','atlas.rwa-id.eth',
    'vega.rwa-id.eth','nexus.test.rwa-id.eth','delta.rwa-id.eth',
    'omega.test.rwa-id.eth','prime.rwa-id.eth','axis.rwa-id.eth',
    'lux.test.rwa-id.eth','node.rwa-id.eth','quorum.rwa-id.eth',
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
        <span
          key={i}
          className={`token${i === hotIdx ? ' hot' : ''}`}
          style={{
            left: `${t.x}%`, top: `${t.y}%`,
            transform: `translate(-50%,-50%) rotate(${t.rot}deg)`,
          }}
        >
          {t.s}
        </span>
      ))}
    </div>
  )
}

function FingerprintAmbient() {
  return (
    <>
      <div className="fp-ambient fp-ambient-1"/>
      <div className="fp-ambient fp-ambient-2"/>
      <svg className="fp" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ color: '#9fc1ff' }}>
        <path d="M100 25c-32 0-56 24-56 56v36c0 12 4 22 10 30"/>
        <path d="M100 40c-24 0-42 18-42 42v38c0 16 4 28 11 38" strokeOpacity=".9"/>
        <path d="M100 55c-16 0-28 12-28 28v42c0 22 6 36 14 48" strokeOpacity=".8"/>
        <path d="M100 70c-8 0-14 6-14 14v50c0 26 8 42 16 54" strokeOpacity=".7"/>
        <path d="M100 85v54c0 28 6 42 12 54" strokeOpacity=".6"/>
        <path d="M114 82c0-8-6-14-14-14s-14 6-14 14" strokeOpacity=".9"/>
        <path d="M128 95c0-16-12-28-28-28" strokeOpacity=".8"/>
        <path d="M142 110c0-24-18-42-42-42" strokeOpacity=".65"/>
      </svg>
      <div className="fp-sweep"/>
    </>
  )
}

const FP_VARIANTS = { biometric: FingerprintBiometric, contours: FingerprintContours, tokens: FingerprintTokens, ambient: FingerprintAmbient }

// ── Sub-components ────────────────────────────────────────────────────────────

function Marquee({ data, className = '' }) {
  const doubled = [...data, ...data]
  return (
    <div className={`marquee ${className}`}>
      <div className="marquee-track">
        {doubled.map((d, i) => (
          <div key={i} className="chip">
            <span className="chip-icon" style={{ background: d.bg, ...(d.colorText ? { color: d.colorText } : {}) }}>
              {d.letter}
            </span>
            {d.name}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Landing({ onConnect }) {
  const [domainIdx, setDomainIdx] = useState(0)
  const [domainVisible, setDomainVisible] = useState(true)
  const [codeLang, setCodeLang] = useState('viem')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setDomainVisible(false)
      setTimeout(() => {
        setDomainIdx(i => (i + 1) % DOMAINS.length)
        setDomainVisible(true)
      }, 220)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  function handleCopy() {
    const snippetText = {
      viem: `// Resolve an RWA-ID across any supported chain\n\nimport { createPublicClient, http } from 'viem'\nimport { base } from 'viem/chains'\n\nconst client = createPublicClient({\n  chain: base,\n  transport: http(),\n})\n\nconst address = await client.getEnsAddress({\n  name: 'joe.test.rwa-id.eth',\n})`,
      ethers: `// Resolve an RWA-ID with ethers.js\n\nimport { JsonRpcProvider } from 'ethers'\n\nconst provider = new JsonRpcProvider('https://base.rpc')\n\nconst address = await provider.resolveName(\n  'joe.test.rwa-id.eth'\n)`,
      wagmi: `// Resolve an RWA-ID from a React component\n\nimport { useEnsAddress } from 'wagmi'\n\nconst { data: address } = useEnsAddress({\n  name: 'joe.test.rwa-id.eth',\n  chainId: 8453, // Base\n})`,
    }
    navigator.clipboard?.writeText(snippetText[codeLang])
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const FingerprintComponent = FP_VARIANTS.contours

  return (
    <div className="landing-root">
      {/* Background */}
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-grid"/>
        <div className="bg-vignette"/>
        <div className="bg-hero-glow"/>
      </div>

      {/* Nav */}
      <header className="l-nav">
        <a className="brand" href="#">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="10" stroke="url(#lbg)" strokeWidth="1.2"/>
            <circle cx="11" cy="11" r="6" stroke="url(#lbg)" strokeWidth="1.2"/>
            <circle cx="11" cy="11" r="2.2" fill="#3d7fff"/>
            <defs>
              <linearGradient id="lbg" x1="0" y1="0" x2="22" y2="22">
                <stop stopColor="#7aa6ff"/>
                <stop offset="1" stopColor="#3d7fff"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="brand-wordmark">RWA<span className="brand-dot">·</span>ID</span>
        </a>
        <nav className="nav-links">
          <a href="#">Docs</a>
          <a href="#">Pricing</a>
          <a href="#">Changelog</a>
        </nav>
        <div className="nav-right">
          <a className="nav-signin" href="#">Sign in</a>
          <button className="btn btn-ghost btn-sm" onClick={onConnect}>
            Connect <span className="arrow">→</span>
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="hero-inner">
            <div className="badge">
              <span className="badge-dot"/>
              On-chain<span className="badge-sep">·</span>ENS-compatible<span className="badge-sep">·</span>ERC-721
            </div>
            <h1 className="headline">
              Identity Infrastructure<br/>
              for <span className="headline-accent">Real-World Assets</span>
            </h1>
            <p className="sub">
              Issue, manage, and revoke auditable cross-chain identities for institutional
              clients. One ENS subdomain, resolvable on every network, minted as a verifiable
              ERC-721 — with zero custody of personal data.
            </p>
            <div className="cta-row">
              <button className="btn btn-primary" onClick={onConnect}>
                <span className="btn-glow"/>
                Connect to Manage Identities
                <span className="arrow">→</span>
              </button>
              <a className="btn btn-ghost" href="#">View the protocol</a>
            </div>
            <div className="hero-meta">
              <span className="meta-item"><span className="meta-dot live"/> mainnet live</span>
              <span className="meta-sep"/>
              <span className="meta-item">v2.4 · audited by Spearbit, Trail of Bits</span>
            </div>
          </div>
        </section>

        {/* Bento */}
        <section className="bento">
          <div className="bento-grid">

            {/* 01 Identity Registry */}
            <article className="card card-registry">
              <div className="card-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">01</span>
                  <span className="eyebrow-label">Identity Registry</span>
                </div>
                <div className="card-chip">ERC-721 · ENS node</div>
              </div>

              <div className="fingerprint-stage">
                <FingerprintComponent/>
              </div>

              <div className="domain-pill">
                <span className="pill-live"><span className="pill-live-dot"/>live</span>
                <span className="pill-domain" style={{ opacity: domainVisible ? 1 : 0 }}>
                  {DOMAINS[domainIdx]}
                </span>
                <span className="pill-token">#0x4a91…</span>
              </div>

              <div className="card-body">
                <h3>Every identity is a token.</h3>
                <p>Each issued subdomain becomes an ERC-721 ENS node — transferable by policy, revocable by issuer, and fully auditable on-chain. No off-chain registry, no black boxes.</p>
              </div>
            </article>

            {/* 02 Zero-Touch Privacy */}
            <article className="card card-privacy">
              <div className="card-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">02</span>
                  <span className="eyebrow-label">Zero-Touch Privacy</span>
                </div>
              </div>

              <div className="privacy-diagram" aria-hidden="true">
                <div className="privacy-node">
                  <span>KYC provider</span>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1.5v6M9 10.5v.01M1.5 16.5h15L9 3 1.5 16.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="privacy-wire"><span className="privacy-wire-dash"/></div>
                <div className="privacy-node privacy-rwa">
                  <span>RWA-ID</span>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="9" cy="9" r="2" fill="currentColor"/>
                  </svg>
                </div>
                <div className="privacy-blocked">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M3 11L11 3" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  <span>no PII transit</span>
                </div>
              </div>

              <div className="card-body">
                <h3>We never touch KYC.</h3>
                <p>Your compliance partner verifies; we mint. Personal data stays where it was attested — the chain records only the cryptographic fact.</p>
              </div>
            </article>

            {/* 03 Wallets */}
            <article className="card card-wallets">
              <div className="card-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">03</span>
                  <span className="eyebrow-label">Compatible Client Wallets</span>
                </div>
              </div>
              <Marquee data={WALLETS} className="marquee-wallets"/>
              <div className="card-body">
                <h3>Works in every wallet your clients already use.</h3>
                <p>Standard ENS resolution — no extensions, no proprietary SDK. If it signs EIP-191, it resolves an RWA-ID.</p>
              </div>
            </article>

            {/* 04 Cross-chain */}
            <article className="card card-chains">
              <div className="card-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">04</span>
                  <span className="eyebrow-label">Cross-Chain via CCIP Read</span>
                </div>
              </div>
              <Marquee data={CHAINS} className="marquee-chains"/>
              <div className="card-body">
                <h3>One identity. Every chain.</h3>
                <p>CCIP Read (EIP-3668) resolves the same subdomain on Ethereum, Base, Polygon, Arbitrum, Optimism, Linea and seven more — with cryptographic proofs, not bridges.</p>
              </div>
            </article>

            {/* 05 Code snippet */}
            <article className="card card-code">
              <div className="card-head">
                <div className="eyebrow">
                  <span className="eyebrow-num">05</span>
                  <span className="eyebrow-label">Drop-in Integration</span>
                </div>
              </div>

              <div className="code-window">
                <div className="code-tabs">
                  {['viem','ethers','wagmi'].map(lang => (
                    <button
                      key={lang}
                      className={`code-tab${codeLang === lang ? ' is-active' : ''}`}
                      onClick={() => setCodeLang(lang)}
                    >
                      {lang}
                    </button>
                  ))}
                  <button className={`code-copy${copied ? ' is-copied' : ''}`} onClick={handleCopy} aria-label="Copy snippet">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M2 8.5V2.5a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.1"/>
                    </svg>
                    <span className="copy-label">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="code-body">
                  <code>{SNIPPETS[codeLang]}</code>
                </pre>
              </div>

              <div className="card-body card-body-tight">
                <h3>Resolve in three lines.</h3>
              </div>
            </article>

          </div>
        </section>

        {/* Stats */}
        <section className="l-stats">
          <div className="stats-row">
            <div className="stat">
              <div className="stat-num">10<span className="stat-plus">+</span></div>
              <div className="stat-label">Supported Networks</div>
            </div>
            <div className="stat">
              <div className="stat-num stat-num-tight">ERC-721</div>
              <div className="stat-label">Token Standard</div>
            </div>
            <div className="stat">
              <div className="stat-num stat-num-tight">CCIP Read</div>
              <div className="stat-label">Resolution Protocol</div>
            </div>
            <div className="stat">
              <div className="stat-num stat-num-tight">ENS</div>
              <div className="stat-label">Identity Layer</div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="footer-cta">
          <div className="footer-cta-inner">
            <div className="fc-eyebrow">Ready when your compliance team is.</div>
            <h2 className="fc-headline">
              Mint your first <span className="headline-accent">institutional identity</span>.
            </h2>
            <div className="cta-row">
              <button className="btn btn-primary" onClick={onConnect}>
                <span className="btn-glow"/>
                Connect to Manage Identities
                <span className="arrow">→</span>
              </button>
              <a className="btn btn-ghost" href="#">Book a walkthrough</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="l-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="brand-wordmark">RWA<span className="brand-dot">·</span>ID</span>
              <span className="footer-tag">Identity infrastructure for regulated on-chain finance.</span>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <div className="footer-head">Product</div>
                <a href="#">Registry</a>
                <a href="#">Resolver</a>
                <a href="#">Dashboard</a>
              </div>
              <div className="footer-col">
                <div className="footer-head">Developers</div>
                <a href="#">Docs</a>
                <a href="#">Contracts</a>
                <a href="#">Status</a>
              </div>
              <div className="footer-col">
                <div className="footer-head">Company</div>
                <a href="#">About</a>
                <a href="#">Security</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 RWA-ID Labs</span>
            <span>rwa-id.eth</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
