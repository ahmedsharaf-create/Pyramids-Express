import React, { useState, useRef } from 'react'
import { Icon, Btn, Input, Card, Toast } from './ui.jsx'
import { db, APP_ID } from './firebase.js'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

const ff = "'Barlow Condensed', sans-serif"

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ person, size = 72, dark }) {
  const initials = (person.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      border: `3px solid ${person.role === 'head' ? '#ef4444' : person.role === 'regional' ? '#f97316' : person.role === 'area' ? '#eab308' : 'rgba(128,128,128,0.3)'}`,
      background: person.photo
        ? 'transparent'
        : dark ? '#1a1a1a' : '#f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 0 2px ${dark ? '#111' : '#fff'}, 0 4px 16px rgba(0,0,0,0.15)`,
    }}>
      {person.photo
        ? <img src={person.photo} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: ff, fontWeight: 900, fontSize: size * 0.28, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)' }}>{initials}</span>
      }
    </div>
  )
}

// ─── Connector line SVG between levels ───────────────────────────────────────
function Connector({ dark }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: 32, alignItems: 'center' }}>
      <div style={{ width: 2, height: 32, background: dark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)', borderRadius: 99 }} />
    </div>
  )
}

// ─── Person Card ──────────────────────────────────────────────────────────────
function PersonCard({ person, dark, size = 'md', highlight = false }) {
  const sizes = { sm: { avatar: 52, name: 13, role: 9, pad: '14px 16px' }, md: { avatar: 72, name: 15, role: 10, pad: '20px 22px' }, lg: { avatar: 88, name: 18, role: 11, pad: '24px 28px' } }
  const s = sizes[size] || sizes.md
  const roleColors = { head: '#ef4444', regional: '#f97316', area: '#eab308' }
  const roleLabels = { head: 'Head of Retail', regional: 'Regional Manager', area: 'Area Manager' }

  return (
    <div style={{
      background: dark ? '#111' : '#fff',
      border: `1px solid ${highlight ? 'rgba(239,68,68,0.5)' : dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      borderRadius: 16, padding: s.pad,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
      boxShadow: highlight ? '0 0 0 2px rgba(239,68,68,0.2), 0 8px 32px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
      transition: 'all 0.2s', minWidth: size === 'lg' ? 180 : size === 'md' ? 150 : 130,
      animation: 'fadeUp 0.4s ease',
    }}>
      <Avatar person={person} size={s.avatar} dark={dark} />
      <div>
        <p style={{ fontFamily: ff, fontWeight: 900, fontSize: s.name, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, color: dark ? '#fff' : '#111' }}>
          {person.name}
        </p>
        <p style={{ fontFamily: ff, fontWeight: 700, fontSize: s.role, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '4px 0 0', color: roleColors[person.role] || 'rgba(128,128,128,0.6)' }}>
          {roleLabels[person.role] || person.role}
        </p>
      </div>
    </div>
  )
}

// ─── Shop Tag ─────────────────────────────────────────────────────────────────
function ShopTag({ name, dark, isUserShop }) {
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 10,
      background: isUserShop
        ? 'rgba(239,68,68,0.12)'
        : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${isUserShop ? 'rgba(239,68,68,0.4)' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      fontFamily: ff, fontWeight: isUserShop ? 800 : 600, fontSize: 11,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      color: isUserShop ? '#ef4444' : dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {isUserShop && <Icon name="mapPin" size={11} />}
      {name}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETAIL MAP PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function RetailMapPage({ dark, appState, onBack }) {
  const { isAdmin, user, users, retailMap = [], shops } = appState

  // Find the logged-in agent's record from users list
  const agentRecord = users.find(u => u.email === user?.email)
  const userShop    = agentRecord?.shopName    || ''
  const userArea    = agentRecord?.areaManager || ''

  // ── Build derived hierarchy from retailMap ─────────────────────────────────
  const head      = retailMap.find(p => p.role === 'head')
  const regionals = retailMap.filter(p => p.role === 'regional')
  const areas     = retailMap.filter(p => p.role === 'area')

  // For a regular user — find their area manager person, their regional, and show only that chain
  const userAreaPerson = areas.find(p => p.linkedAreaManager === userArea || p.name === userArea)
  const userRegional   = regionals.find(p =>
    p.id === userAreaPerson?.regionalId ||
    (userAreaPerson?.regionalName && p.name === userAreaPerson.regionalName)
  )

  // Shops grouped by area manager name
  const shopsByArea = {}
  shops.forEach(s => {
    if (!s.isPlaceholder) {
      const key = s.areaManager
      if (!shopsByArea[key]) shopsByArea[key] = []
      shopsByArea[key].push(s.shopName)
    }
  })

  // ── Admin sees full map; agent sees their slice ────────────────────────────
  const showFullMap = isAdmin

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px', animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ef4444', marginBottom: 32 }}>
        <Icon name="arrowLeft" size={16} /> Back to Dashboard
      </button>

      <div style={{ marginBottom: 48, paddingBottom: 28, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
        <h1 style={{ fontFamily: ff, fontWeight: 900, fontSize: 40, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: dark ? '#fff' : '#111' }}>
          Retail <span style={{ color: '#ef4444' }}>Map</span>
        </h1>
        <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.55)', marginTop: 8 }}>
          {showFullMap ? 'Full organizational hierarchy' : `Your chain — ${userShop || 'No shop assigned'}`}
        </p>
      </div>

      {retailMap.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', border: `2px dashed ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 20, fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.35)' }}>
          Retail map not configured yet — admin can set it up in Management
        </div>
      ) : showFullMap ? (
        <FullMap dark={dark} head={head} regionals={regionals} areas={areas} shopsByArea={shopsByArea} />
      ) : (
        <UserMap dark={dark} head={head} regional={userRegional} areaPerson={userAreaPerson} userArea={userArea} userShop={userShop} shopsByArea={shopsByArea} />
      )}
    </div>
  )
}

// ── Full map (admin) ──────────────────────────────────────────────────────────
function FullMap({ dark, head, regionals, areas, shopsByArea }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Head */}
      {head && (
        <>
          <PersonCard person={head} dark={dark} size="lg" />
          {regionals.length > 0 && <Connector dark={dark} />}
        </>
      )}

      {/* Regionals row */}
      {regionals.length > 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
            {regionals.map(reg => {
              const regAreas = areas.filter(a => a.regionalId === reg.id || a.regionalName === reg.name)
              return (
                <div key={reg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                  <PersonCard person={reg} dark={dark} size="md" />
                  {regAreas.length > 0 && <Connector dark={dark} />}
                  {regAreas.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                      {regAreas.map(area => {
                        const areaShops = shopsByArea[area.linkedAreaManager || area.name] || []
                        return (
                          <div key={area.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                            <PersonCard person={area} dark={dark} size="sm" />
                            {areaShops.length > 0 && <Connector dark={dark} />}
                            {areaShops.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                {areaShops.map(s => <ShopTag key={s} name={s} dark={dark} isUserShop={false} />)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Areas with no regional */}
      {(() => {
        const orphanAreas = areas.filter(a => !a.regionalId && !a.regionalName && regionals.length === 0)
        if (!orphanAreas.length) return null
        return (
          <>
            {head && <Connector dark={dark} />}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {orphanAreas.map(area => {
                const areaShops = shopsByArea[area.linkedAreaManager || area.name] || []
                return (
                  <div key={area.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <PersonCard person={area} dark={dark} size="sm" />
                    {areaShops.length > 0 && <Connector dark={dark} />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      {areaShops.map(s => <ShopTag key={s} name={s} dark={dark} isUserShop={false} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      })()}
    </div>
  )
}

// ── User's personal map slice ─────────────────────────────────────────────────
function UserMap({ dark, head, regional, areaPerson, userArea, userShop, shopsByArea }) {
  const areaShops = shopsByArea[userArea] || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, maxWidth: 500, margin: '0 auto' }}>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { color: '#ef4444', label: 'Head of Retail' },
          { color: '#f97316', label: 'Regional Manager' },
          { color: '#eab308', label: 'Area Manager' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            <span style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {head && (
        <>
          <PersonCard person={head} dark={dark} size="lg" highlight={false} />
          <Connector dark={dark} />
        </>
      )}
      {regional && (
        <>
          <PersonCard person={regional} dark={dark} size="md" />
          <Connector dark={dark} />
        </>
      )}
      {areaPerson && (
        <>
          <PersonCard person={areaPerson} dark={dark} size="sm" />
          <Connector dark={dark} />
        </>
      )}
      {!areaPerson && userArea && (
        <>
          {/* Fallback: show area name as text if no person record */}
          <div style={{ padding: '14px 22px', borderRadius: 14, background: dark ? '#111' : '#fff', border: `1px solid rgba(234,179,8,0.4)`, fontFamily: ff, fontWeight: 900, fontSize: 14, textTransform: 'uppercase', color: '#eab308' }}>
            {userArea}
            <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(234,179,8,0.6)', margin: '3px 0 0' }}>Area Manager</p>
          </div>
          <Connector dark={dark} />
        </>
      )}

      {/* Shops in this area */}
      {areaShops.length > 0 && (
        <div style={{ width: '100%', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 16, padding: 20 }}>
          <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.5)', margin: '0 0 14px', textAlign: 'center' }}>
            Shops in your area
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {areaShops.map(s => <ShopTag key={s} name={s} dark={dark} isUserShop={s === userShop} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETAIL MAP ADMIN PANEL (embedded in AdminPage as a tab)
// ═══════════════════════════════════════════════════════════════════════════════
export function RetailMapAdmin({ dark, retailMap = [], areas, setToast }) {
  const [tab, setTab]         = useState('head')   // head | regional | area
  const [form, setForm]       = useState({ name: '', role: 'head', regionalId: '', linkedAreaManager: '' })
  const [photoFile, setPhoto] = useState(null)
  const [photoName, setPhotoName] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const regionals = retailMap.filter(p => p.role === 'regional')

  const handlePhotoSelect = e => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500 * 1024) { setToast({ message: 'Photo too large! Max 500KB', type: 'error' }); return }
    const reader = new FileReader()
    reader.onload = ev => { setPhoto(ev.target.result); setPhotoName(file.name) }
    reader.readAsDataURL(file)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim()) return setToast({ message: 'Enter a name', type: 'error' })
    setLoading(true)
    try {
      const id = `rmap_${Date.now()}`
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'retail_map', id), {
        id, name: form.name.trim(), role: tab,
        regionalId:         tab === 'area' ? form.regionalId : '',
        regionalName:       tab === 'area' ? (regionals.find(r => r.id === form.regionalId)?.name || '') : '',
        linkedAreaManager:  tab === 'area' ? form.linkedAreaManager : '',
        photo: photoFile || '',
        createdAt: new Date().toISOString(),
      })
      setToast({ message: `${tab.charAt(0).toUpperCase() + tab.slice(1)} added!`, type: 'success' })
      setForm({ name: '', role: tab, regionalId: '', linkedAreaManager: '' })
      setPhoto(null); setPhotoName(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) { setToast({ message: 'Failed: ' + err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from the retail map?`)) return
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'retail_map', id))
    setToast({ message: 'Person removed', type: 'error' })
  }

  const ROLE_TABS = [
    { id: 'head',     label: 'Head of Retail',   color: '#ef4444' },
    { id: 'regional', label: 'Regional Manager', color: '#f97316' },
    { id: 'area',     label: 'Area Manager',     color: '#eab308' },
  ]

  const currentPeople = retailMap.filter(p => p.role === tab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Role tabs */}
      <div style={{ display: 'flex', gap: 2, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {ROLE_TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setForm(f => ({ ...f, name: '', regionalId: '', linkedAreaManager: '' })) }} style={{
            padding: '8px 18px', border: 'none', cursor: 'pointer', borderRadius: 9,
            background: tab === t.id ? t.color : 'transparent',
            color: tab === t.id ? '#fff' : dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
            fontFamily: ff, fontWeight: 800, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Add form */}
        <Card dark={dark}>
          <p style={{ fontFamily: ff, fontWeight: 900, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16, color: ROLE_TABS.find(t => t.id === tab)?.color }}>
            Add {ROLE_TABS.find(t => t.id === tab)?.label}
          </p>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required dark={dark} />

            {/* For Area Manager — link to Regional and to shop manager name */}
            {tab === 'area' && (
              <>
                <select
                  value={form.regionalId}
                  onChange={e => setForm(f => ({ ...f, regionalId: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, color: dark ? '#fff' : '#111', fontFamily: ff, fontWeight: 600, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', outline: 'none' }}
                >
                  <option value="">LINK TO REGIONAL (optional)</option>
                  {regionals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select
                  value={form.linkedAreaManager}
                  onChange={e => setForm(f => ({ ...f, linkedAreaManager: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, color: dark ? '#fff' : '#111', fontFamily: ff, fontWeight: 600, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', outline: 'none' }}
                >
                  <option value="">LINK TO SHOP AREA MANAGER NAME</option>
                  {[...new Set(areas.map(a => a.areaManager || a.manager).filter(Boolean))].sort().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </>
            )}

            {/* Photo upload */}
            <label htmlFor="rmap-photo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, border: `2px dashed ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, cursor: 'pointer', gap: 6, transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = ROLE_TABS.find(t => t.id === tab)?.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            >
              {photoFile ? (
                <img src={photoFile} alt="preview" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <Icon name="upload" size={20} style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
              )}
              <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                {photoName || 'Upload Photo (< 500KB)'}
              </span>
              <input id="rmap-photo" ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </label>

            <Btn type="submit" color={tab === 'head' ? 'red' : tab === 'regional' ? 'gray' : 'black'} full disabled={loading}>
              {loading ? 'Saving…' : `Add ${ROLE_TABS.find(t => t.id === tab)?.label}`}
            </Btn>
          </form>
        </Card>

        {/* Current people in this role */}
        <Card dark={dark}>
          <p style={{ fontFamily: ff, fontWeight: 900, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)' }}>
            Current — {ROLE_TABS.find(t => t.id === tab)?.label} ({currentPeople.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
            {currentPeople.length === 0 && (
              <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.35)', textAlign: 'center', padding: '20px 0' }}>
                None added yet
              </p>
            )}
            {currentPeople.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
                <Avatar person={p} size={42} dark={dark} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', margin: 0, color: dark ? '#fff' : '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  {p.linkedAreaManager && (
                    <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#eab308', margin: '2px 0 0' }}>→ {p.linkedAreaManager}</p>
                  )}
                  {p.regionalName && (
                    <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#f97316', margin: '2px 0 0' }}>Under: {p.regionalName}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(p.id, p.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(128,128,128,0.35)', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(128,128,128,0.35)'}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
