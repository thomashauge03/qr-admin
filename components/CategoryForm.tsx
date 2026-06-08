'use client'
import { useState, useEffect } from 'react'
import { Category, CategoryInsert, QRType, QRData } from '@/types'

const PRESET_COLORS = [
  '#e84e2a', '#2a7a4b', '#2a4a7a', '#7a2a6a',
  '#7a6a2a', '#2a6a7a', '#4a2a7a', '#7a3a2a',
]

const QR_TYPES: { value: QRType; label: string; icon: string; desc: string }[] = [
  { value: 'shop',     icon: '▦', label: 'Butikkinfo',  desc: 'Navn, hylle og ID' },
  { value: 'url',      icon: '🔗', label: 'URL',         desc: 'Lenke til nettside' },
  { value: 'text',     icon: '✏', label: 'Tekst',       desc: 'Fri tekst' },
  { value: 'email',    icon: '✉', label: 'E-post',      desc: 'Åpner e-postklient' },
  { value: 'phone',    icon: '📞', label: 'Telefon',     desc: 'Ring ved skanning' },
  { value: 'sms',      icon: '💬', label: 'SMS',         desc: 'Send melding' },
  { value: 'wifi',     icon: '📶', label: 'WiFi',        desc: 'Koble til nettverk' },
  { value: 'location', icon: '📍', label: 'Lokasjon',    desc: 'GPS-koordinater' },
]

interface Props {
  category?: Category | null
  onSave: (data: CategoryInsert) => Promise<void>
  onClose: () => void
}

const emptyQRData = (): QRData => ({ type: 'shop' })

export default function CategoryForm({ category, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [shelfNumber, setShelfNumber] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [qrType, setQRType] = useState<QRType>('shop')
  const [qrData, setQRData] = useState<QRData>(emptyQRData())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (category) {
      setName(category.name)
      setShelfNumber(category.shelf_number)
      setDescription(category.description || '')
      setColor(category.color || PRESET_COLORS[0])
      setQRType(category.qr_type || 'shop')
      setQRData(category.qr_data || emptyQRData())
    }
  }, [category])

  const set = (key: keyof QRData, value: string | boolean) =>
    setQRData(p => ({ ...p, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !shelfNumber.trim()) {
      setError('Navn og hyllenummer er påkrevd')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        shelf_number: shelfNumber.trim(),
        description: description.trim() || null,
        color,
        qr_type: qrType,
        qr_data: { ...qrData, type: qrType },
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--paper)',
    border: '1.5px solid var(--border)',
    color: 'var(--ink)',
  }
  const labelStyle = {
    fontFamily: 'DM Mono, monospace',
    fontSize: '0.72rem',
    letterSpacing: '0.05em',
    color: 'var(--muted)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,15,15,0.6)' }}>
      <div
        className="animate-fade-up w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', maxHeight: '90vh' }}
      >
        <div className="p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl" style={{ fontWeight: 700 }}>
                {category ? 'Rediger kategori' : 'Ny kategori'}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 4 }}>
                {category ? `Oppdaterer: ${category.name}` : 'Legg til en ny kategori'}
              </p>
            </div>
            <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.25rem' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Navn */}
            <div>
              <label className="block mb-1.5" style={labelStyle}>KATEGORINAVN *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="f.eks. Sportsutstyr"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Hyllenummer */}
            <div>
              <label className="block mb-1.5" style={labelStyle}>HYLLENUMMER *</label>
              <input
                type="text"
                value={shelfNumber}
                onChange={e => setShelfNumber(e.target.value)}
                placeholder="f.eks. A-12"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ ...inputStyle, fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Beskrivelse */}
            <div>
              <label className="block mb-1.5" style={labelStyle}>BESKRIVELSE</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Valgfri beskrivelse..."
                rows={2}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Farge */}
            <div>
              <label className="block mb-2" style={labelStyle}>FARGE</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="rounded-full transition-transform hover:scale-110"
                    style={{
                      width: 28, height: 28,
                      backgroundColor: c,
                      outline: color === c ? `3px solid ${c}` : 'none',
                      outlineOffset: 2,
                      transform: color === c ? 'scale(1.15)' : undefined,
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="rounded-full cursor-pointer border-0"
                  style={{ width: 28, height: 28, padding: 2, backgroundColor: 'transparent' }}
                  title="Egendefinert farge"
                />
              </div>
            </div>

            {/* QR-type */}
            <div>
              <label className="block mb-2" style={labelStyle}>QR-KODE INNHOLD</label>
              <div className="grid grid-cols-4 gap-2">
                {QR_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setQRType(t.value)}
                    className="rounded-xl py-2.5 px-2 text-center transition-all"
                    style={{
                      backgroundColor: qrType === t.value ? 'var(--ink)' : 'var(--paper)',
                      color: qrType === t.value ? 'var(--paper)' : 'var(--muted)',
                      border: `1.5px solid ${qrType === t.value ? 'var(--ink)' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{ fontSize: '1rem', marginBottom: 2 }}>{t.icon}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.04em' }}>
                      {t.label.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamiske QR-felt */}
            {qrType === 'url' && (
              <div>
                <label className="block mb-1.5" style={labelStyle}>URL</label>
                <input
                  type="url"
                  value={qrData.url || ''}
                  onChange={e => set('url', e.target.value)}
                  placeholder="https://eksempel.no"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label className="block mb-1.5" style={labelStyle}>TEKST</label>
                <textarea
                  value={qrData.text || ''}
                  onChange={e => set('text', e.target.value)}
                  placeholder="Skriv inn tekst som skal vises ved skanning..."
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="block mb-1.5" style={labelStyle}>E-POSTADRESSE</label>
                  <input
                    type="email"
                    value={qrData.email || ''}
                    onChange={e => set('email', e.target.value)}
                    placeholder="post@eksempel.no"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label className="block mb-1.5" style={labelStyle}>EMNE (VALGFRITT)</label>
                  <input
                    type="text"
                    value={qrData.email_subject || ''}
                    onChange={e => set('email_subject', e.target.value)}
                    placeholder="Emne for e-posten"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label className="block mb-1.5" style={labelStyle}>MELDING (VALGFRITT)</label>
                  <textarea
                    value={qrData.email_body || ''}
                    onChange={e => set('email_body', e.target.value)}
                    placeholder="Forhåndsutfylt melding..."
                    rows={2}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>
            )}

            {(qrType === 'phone' || qrType === 'sms') && (
              <div className="space-y-3">
                <div>
                  <label className="block mb-1.5" style={labelStyle}>TELEFONNUMMER</label>
                  <input
                    type="tel"
                    value={qrData.phone || ''}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+47 123 45 678"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                {qrType === 'sms' && (
                  <div>
                    <label className="block mb-1.5" style={labelStyle}>MELDING (VALGFRITT)</label>
                    <textarea
                      value={qrData.sms_body || ''}
                      onChange={e => set('sms_body', e.target.value)}
                      placeholder="Forhåndsutfylt SMS-melding..."
                      rows={2}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                )}
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block mb-1.5" style={labelStyle}>NETTVERKSNAVN (SSID)</label>
                  <input
                    type="text"
                    value={qrData.wifi_ssid || ''}
                    onChange={e => set('wifi_ssid', e.target.value)}
                    placeholder="MinWiFi"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label className="block mb-1.5" style={labelStyle}>PASSORD</label>
                  <input
                    type="text"
                    value={qrData.wifi_password || ''}
                    onChange={e => set('wifi_password', e.target.value)}
                    placeholder="WiFi-passord"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label className="block mb-1.5" style={labelStyle}>KRYPTERING</label>
                  <select
                    value={qrData.wifi_encryption || 'WPA'}
                    onChange={e => set('wifi_encryption', e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
                  >
                    <option value="WPA">WPA/WPA2 (anbefalt)</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Ingen passord</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrData.wifi_hidden || false}
                    onChange={e => set('wifi_hidden', e.target.checked)}
                    className="rounded"
                  />
                  <span style={{ ...labelStyle, fontSize: '0.8rem' }}>Skjult nettverk</span>
                </label>
              </div>
            )}

            {qrType === 'location' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5" style={labelStyle}>BREDDEGRAD (LAT)</label>
                    <input
                      type="text"
                      value={qrData.lat || ''}
                      onChange={e => set('lat', e.target.value)}
                      placeholder="59.9139"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5" style={labelStyle}>LENGDEGRAD (LNG)</label>
                    <input
                      type="text"
                      value={qrData.lng || ''}
                      onChange={e => set('lng', e.target.value)}
                      placeholder="10.7522"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5" style={labelStyle}>STEDSNAVN (VALGFRITT)</label>
                  <input
                    type="text"
                    value={qrData.location_label || ''}
                    onChange={e => set('location_label', e.target.value)}
                    placeholder="f.eks. Butikk, Lager A"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-70"
                style={{ backgroundColor: 'var(--paper-dark)', color: 'var(--ink)' }}
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}
              >
                {loading ? 'Lagrer...' : category ? 'Oppdater' : 'Opprett'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
