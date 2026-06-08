'use client'
import { useState, useEffect } from 'react'
import { Category, CategoryInsert, QRType, QRData } from '@/types'

const PRESET_COLORS = [
  '#000000', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]

const QR_TYPES: { value: QRType; label: string; icon: string }[] = [
  { value: 'shop',     icon: '▦', label: 'Butikk'   },
  { value: 'url',      icon: '🔗', label: 'URL'      },
  { value: 'text',     icon: '✏', label: 'Tekst'    },
  { value: 'email',    icon: '✉', label: 'E-post'   },
  { value: 'phone',    icon: '📞', label: 'Telefon'  },
  { value: 'sms',      icon: '💬', label: 'SMS'      },
  { value: 'wifi',     icon: '📶', label: 'WiFi'     },
  { value: 'location', icon: '📍', label: 'Lokasjon' },
]

interface Props {
  category?: Category | null
  onSave: (data: CategoryInsert) => Promise<void>
  onClose: () => void
}

const emptyQR = (): QRData => ({ type: 'shop' })

export default function CategoryForm({ category, onSave, onClose }: Props) {
  const [name,        setName]        = useState('')
  const [shelf,       setShelf]       = useState('')
  const [description, setDescription] = useState('')
  const [color,       setColor]       = useState(PRESET_COLORS[0])
  const [qrType,      setQRType]      = useState<QRType>('shop')
  const [qrData,      setQRData]      = useState<QRData>(emptyQR())
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (category) {
      setName(category.name)
      setShelf(category.shelf_number)
      setDescription(category.description || '')
      setColor(category.color || PRESET_COLORS[0])
      setQRType(category.qr_type || 'shop')
      setQRData(category.qr_data || emptyQR())
    }
  }, [category])

  const set = (key: keyof QRData, value: string | boolean) =>
    setQRData(p => ({ ...p, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !shelf.trim()) { setError('Navn og hyllenummer er påkrevd'); return }
    setLoading(true); setError('')
    try {
      await onSave({
        name: name.trim(), shelf_number: shelf.trim(),
        description: description.trim() || null,
        color, qr_type: qrType,
        qr_data: { ...qrData, type: qrType },
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally { setLoading(false) }
  }

  const label = (txt: string) => (
    <label className="block mb-1.5" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
      {txt}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="anim-scale-in w-full max-w-lg rounded-2xl shadow-xl overflow-y-auto"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '92dvh' }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {category ? 'Rediger kategori' : 'Ny kategori'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
              {category ? `Oppdaterer: ${category.name}` : 'Legg til en ny kategori'}
            </p>
          </div>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ width: 32, height: 32, color: 'var(--muted)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-7 py-6 space-y-5">

            {/* Navn */}
            <div>
              {label('KATEGORINAVN *')}
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="f.eks. Sportsutstyr" />
            </div>

            {/* Hyllenummer */}
            <div>
              {label('HYLLENUMMER *')}
              <input type="text" value={shelf} onChange={e => setShelf(e.target.value)}
                placeholder="f.eks. A-12" style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }} />
            </div>

            {/* Beskrivelse */}
            <div>
              {label('BESKRIVELSE')}
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Valgfri beskrivelse..." rows={2}
                style={{ resize: 'none', borderRadius: 10, padding: '10px 14px', border: '1.5px solid var(--border)',
                  fontSize: '0.875rem', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
            </div>

            {/* Farge */}
            <div>
              {label('FARGE')}
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="rounded-full transition-transform hover:scale-110"
                    style={{ width: 26, height: 26, backgroundColor: c, flexShrink: 0,
                      outline: color === c ? `3px solid ${c}` : '2px solid transparent',
                      outlineOffset: 2, transform: color === c ? 'scale(1.15)' : undefined,
                      border: c === '#ffffff' ? '1px solid var(--border)' : 'none' }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ width: 26, height: 26, padding: 2, backgroundColor: 'transparent',
                    border: '1.5px solid var(--border)', borderRadius: '50%', cursor: 'pointer' }}
                  title="Egendefinert farge" />
              </div>
            </div>

            {/* QR-type */}
            <div>
              {label('QR-KODE INNHOLD')}
              <div className="grid grid-cols-4 gap-2">
                {QR_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setQRType(t.value)}
                    className="rounded-xl py-2.5 px-2 text-center transition-all"
                    style={{
                      backgroundColor: qrType === t.value ? 'var(--black)' : 'var(--gray-50)',
                      color:           qrType === t.value ? 'var(--white)' : 'var(--muted)',
                      border:          `1.5px solid ${qrType === t.value ? 'var(--black)' : 'var(--border)'}`,
                    }}>
                    <div style={{ fontSize: '1rem', marginBottom: 2 }}>{t.icon}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.04em' }}>
                      {t.label.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamiske felt */}
            {qrType === 'url' && (
              <div>{label('URL')}
                <input type="url" value={qrData.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://eksempel.no" />
              </div>
            )}
            {qrType === 'text' && (
              <div>{label('TEKST')}
                <textarea value={qrData.text || ''} onChange={e => set('text', e.target.value)}
                  placeholder="Tekst som vises ved skanning..." rows={3}
                  style={{ resize: 'none', borderRadius: 10, padding: '10px 14px', border: '1.5px solid var(--border)',
                    fontSize: '0.875rem', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
              </div>
            )}
            {qrType === 'email' && (
              <div className="space-y-3">
                <div>{label('E-POSTADRESSE')}<input type="email" value={qrData.email || ''} onChange={e => set('email', e.target.value)} placeholder="post@eksempel.no" /></div>
                <div>{label('EMNE (VALGFRITT)')}<input type="text" value={qrData.email_subject || ''} onChange={e => set('email_subject', e.target.value)} placeholder="Emne" /></div>
                <div>{label('MELDING (VALGFRITT)')}
                  <textarea value={qrData.email_body || ''} onChange={e => set('email_body', e.target.value)}
                    placeholder="Forhåndsutfylt melding..." rows={2}
                    style={{ resize: 'none', borderRadius: 10, padding: '10px 14px', border: '1.5px solid var(--border)',
                      fontSize: '0.875rem', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
                </div>
              </div>
            )}
            {(qrType === 'phone' || qrType === 'sms') && (
              <div className="space-y-3">
                <div>{label('TELEFONNUMMER')}<input type="tel" value={qrData.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+47 123 45 678" style={{ fontFamily: 'JetBrains Mono, monospace' }} /></div>
                {qrType === 'sms' && (
                  <div>{label('MELDING (VALGFRITT)')}
                    <textarea value={qrData.sms_body || ''} onChange={e => set('sms_body', e.target.value)}
                      placeholder="Forhåndsutfylt SMS..." rows={2}
                      style={{ resize: 'none', borderRadius: 10, padding: '10px 14px', border: '1.5px solid var(--border)',
                        fontSize: '0.875rem', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
                  </div>
                )}
              </div>
            )}
            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>{label('NETTVERKSNAVN (SSID)')}<input type="text" value={qrData.wifi_ssid || ''} onChange={e => set('wifi_ssid', e.target.value)} placeholder="MinWiFi" /></div>
                <div>{label('PASSORD')}<input type="text" value={qrData.wifi_password || ''} onChange={e => set('wifi_password', e.target.value)} placeholder="passord" style={{ fontFamily: 'JetBrains Mono, monospace' }} /></div>
                <div>{label('KRYPTERING')}
                  <select value={qrData.wifi_encryption || 'WPA'} onChange={e => set('wifi_encryption', e.target.value)}>
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Ingen passord</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={qrData.wifi_hidden || false} onChange={e => set('wifi_hidden', e.target.checked)}
                    style={{ width: 'auto', padding: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Skjult nettverk</span>
                </label>
              </div>
            )}
            {qrType === 'location' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>{label('BREDDEGRAD')}<input type="text" value={qrData.lat || ''} onChange={e => set('lat', e.target.value)} placeholder="59.9139" style={{ fontFamily: 'JetBrains Mono, monospace' }} /></div>
                  <div>{label('LENGDEGRAD')}<input type="text" value={qrData.lng || ''} onChange={e => set('lng', e.target.value)} placeholder="10.7522" style={{ fontFamily: 'JetBrains Mono, monospace' }} /></div>
                </div>
                <div>{label('STEDSNAVN (VALGFRITT)')}<input type="text" value={qrData.location_label || ''} onChange={e => set('location_label', e.target.value)} placeholder="f.eks. Lager A" /></div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid #fca5a5', color: 'var(--danger)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-7 pb-7">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ backgroundColor: 'var(--gray-100)', color: 'var(--ink)' }}>
              Avbryt
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--black)', color: 'var(--white)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Lagrer...' : category ? 'Oppdater' : 'Opprett'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
