export type QRType = 'shop' | 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'location'

export interface QRData {
  type: QRType
  url?: string
  text?: string
  email?: string
  email_subject?: string
  email_body?: string
  phone?: string
  sms_body?: string
  wifi_ssid?: string
  wifi_password?: string
  wifi_encryption?: 'WPA' | 'WEP' | 'nopass'
  wifi_hidden?: boolean
  lat?: string
  lng?: string
  location_label?: string
}

export interface Category {
  id: string
  name: string
  shelf_number: string
  description: string | null
  color: string | null
  qr_type: QRType | null
  qr_data: QRData | null
  created_at: string
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>
export type CategoryUpdate = Partial<CategoryInsert>

export function buildQRValue(category: Category): string {
  const data = category.qr_data
  const type = category.qr_type || 'shop'

  if (type === 'url' && data?.url) return data.url
  if (type === 'text' && data?.text) return data.text
  if (type === 'email' && data?.email) {
    const params = new URLSearchParams()
    if (data.email_subject) params.set('subject', data.email_subject)
    if (data.email_body) params.set('body', data.email_body)
    const qs = params.toString()
    return `mailto:${data.email}${qs ? '?' + qs : ''}`
  }
  if (type === 'phone' && data?.phone) return `tel:${data.phone}`
  if (type === 'sms' && data?.phone) {
    return `sms:${data.phone}${data.sms_body ? '?body=' + encodeURIComponent(data.sms_body) : ''}`
  }
  if (type === 'wifi' && data?.wifi_ssid) {
    const enc = data.wifi_encryption || 'WPA'
    const hidden = data.wifi_hidden ? 'H:true;' : ''
    return `WIFI:S:${data.wifi_ssid};T:${enc};P:${data.wifi_password || ''};${hidden};`
  }
  if (type === 'location' && data?.lat && data?.lng) {
    return `geo:${data.lat},${data.lng}`
  }

  // default: shop JSON
  return JSON.stringify({ id: category.id, name: category.name, shelf: category.shelf_number })
}
