import { useState } from 'react'

export default function WalkthroughModal({ onClose }) {
  const [result, setResult] = useState('')
  const [sending, setSending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setResult('')
    const formData = new FormData(e.target)
    formData.append('access_key', 'c4621259-2059-4c10-8cb4-d6e8cba3d236')
    try {
      const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setResult('success')
        e.target.reset()
      } else {
        setResult('error')
      }
    } catch {
      setResult('error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(10,23,51,.35)',
          backdropFilter: 'blur(4px)', zIndex: 200,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 201,
        width: '100%', maxWidth: 480,
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        boxShadow: '0 16px 48px rgba(10,23,51,.14)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--f-display)', fontWeight: 600,
              fontSize: 22, letterSpacing: '-.015em', margin: '0 0 4px', color: 'var(--ink)',
            }}>
              Book a walkthrough
            </h2>
            <p style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-4)', margin: 0 }}>
              We'll show you how RWA-ID fits your platform
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-4)', transition: 'background .15s, color .15s',
              cursor: 'pointer', border: 0, background: 'none', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper-2)'; e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-4)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 24px' }}>
          {result === 'success' ? (
            <div style={{
              padding: '24px', textAlign: 'center',
              border: '1px solid var(--good-line)', borderRadius: 'var(--radius)',
              background: 'var(--good-soft)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: 'var(--good)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 8.5l3 3L13 5"/>
                </svg>
              </div>
              <p style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 16, margin: '0 0 4px', color: 'var(--ink)' }}>
                Request received
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                We'll be in touch within one business day.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              {/* Hidden subject */}
              <input type="hidden" name="subject" value="RWA-ID Walkthrough Request" />

              <div className="field">
                <label className="field-label" htmlFor="wt-name">Name</label>
                <div className="d-input">
                  <input id="wt-name" type="text" name="name" placeholder="Jane Smith" required />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="wt-email">Work email</label>
                <div className="d-input">
                  <input id="wt-email" type="email" name="email" placeholder="jane@yourfirm.com" required />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="wt-org">Organization</label>
                <div className="d-input">
                  <input id="wt-org" type="text" name="organization" placeholder="e.g. Acme Capital" />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label className="field-label" htmlFor="wt-msg">Tell us about your use case</label>
                <textarea
                  id="wt-msg"
                  name="message"
                  placeholder="What kind of identities are you looking to issue? How many clients?"
                  required
                  style={{
                    display: 'block', width: '100%', resize: 'vertical',
                    minHeight: 90, padding: '9px 12px',
                    background: 'var(--paper)', border: '1px solid var(--line-2)',
                    borderRadius: 'var(--radius)', color: 'var(--ink)',
                    fontFamily: 'var(--f-sans)', fontSize: 13, lineHeight: 1.5,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--line-2)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {result === 'error' && (
                <div className="callout bad" style={{ marginBottom: 14 }}>
                  Something went wrong — please try again or email us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="btn btn-primary btn-full"
                style={{ opacity: sending ? 0.6 : 1 }}
              >
                {sending ? 'Sending…' : 'Send request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
