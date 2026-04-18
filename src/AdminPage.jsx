import React, { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth'
import { db, APP_ID, secondaryAuth, authErrorMessage } from './firebase.js'
import { doc, setDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore'
import { Icon, Btn, Input, Select, Card, Toast, GlobalStyles } from './ui.jsx'
import { RetailMapAdmin } from './RetailMapPage.jsx'

const ff = "'Barlow Condensed', sans-serif"

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ children, dark, accent = false }) {
  return (
    <p style={{
      fontFamily: ff, fontWeight: 900, fontSize: 11,
      letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16,
      color: accent ? '#ef4444' : (dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'),
    }}>{children}</p>
  )
}

// ─── AdminPage ────────────────────────────────────────────────────────────────
export default function AdminPage({ dark, state, onView, setToast }) {
  const [tab, setTab]     = useState('shops')   // shops | users | materials | requests
  const [loading, setLoading] = useState(false)

  // ── Upload form ────────────────────────────────────────────────────────────
  const [uploadForm, setUploadForm] = useState({ cat: 'orange-info', title: '', type: 'photo' })
  const [fileData,   setFileData]   = useState(null)
  const [fileName,   setFileName]   = useState(null)

  // ── Create agent form ──────────────────────────────────────────────────────
  const [createForm, setCreateForm] = useState({ name: '', email: '', pass: '', area: '', shop: '' })

  // ── Shops management ───────────────────────────────────────────────────────
  const [newManager, setNewManager] = useState('')
  const [newShop,    setNewShop]    = useState('')
  const [shopArea,   setShopArea]   = useState('')

  // ── Filters ────────────────────────────────────────────────────────────────
  const [fSearch, setFSearch] = useState('')
  const [fArea,   setFArea]   = useState('')
  const [fShop,   setFShop]   = useState('')

  // ── Derived data ───────────────────────────────────────────────────────────
  const allMaterials  = Object.values(state.materials).flat()
  const managers      = [...new Set(state.shops.map(s => s.areaManager))].sort()
  const shopsForCreate = createForm.area
    ? state.shops.filter(s => s.areaManager === createForm.area).map(s => s.shopName).sort()
    : []
  const shopsForFilter = fArea
    ? state.shops.filter(s => s.areaManager === fArea).map(s => s.shopName).sort()
    : []

  const filteredUsers = state.users.filter(u => {
    const q = fSearch.toLowerCase()
    if (q && !u.agentName?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false
    if (fArea && u.areaManager !== fArea) return false
    if (fShop && u.shopName  !== fShop)  return false
    return true
  })

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFileSelect = e => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 750 * 1024) { setToast({ message: 'File too large! Max 750KB', type: 'error' }); return }
    const reader = new FileReader()
    reader.onload = ev => { setFileData(ev.target.result); setFileName(file.name) }
    reader.readAsDataURL(file)
  }

  const handleUpload = async e => {
    e.preventDefault()
    if (!fileData) { setToast({ message: 'No file selected', type: 'error' }); return }
    setLoading(true)
    try {
      const id = Date.now().toString()
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'materials', id), {
        category: uploadForm.cat, title: uploadForm.title, type: uploadForm.type,
        url: fileData, createdAt: new Date().toISOString(),
      })
      setToast({ message: 'Resource published!', type: 'success' })
      setUploadForm({ cat: 'orange-info', title: '', type: 'photo' })
      setFileData(null); setFileName(null)
    } catch (err) { setToast({ message: 'Upload failed: ' + err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  const handleCreateUser = async e => {
    e.preventDefault()
    if (!createForm.area || !createForm.shop) { setToast({ message: 'Select area and shop', type: 'error' }); return }
    if (!createForm.email || !createForm.pass) { setToast({ message: 'Email and password are required', type: 'error' }); return }
    if (createForm.pass.length < 6) { setToast({ message: 'Password must be at least 6 characters', type: 'error' }); return }
    setLoading(true)
    try {
      // Create real Firebase Auth account using secondary app (keeps admin session intact)
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        createForm.email.trim().toLowerCase(),
        createForm.pass
      )
      // Set display name
      await updateProfile(cred.user, { displayName: createForm.name.trim() })
      // Sign out of secondary app immediately — we only needed it for account creation
      // Sign out of secondary app — we only needed it for account creation
      await signOut(secondaryAuth)

      // Store profile data in Firestore (NO password stored)
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', cred.user.uid), {
        uid:         cred.user.uid,
        email:       createForm.email.trim().toLowerCase(),
        agentName:   createForm.name.trim(),
        areaManager: createForm.area,
        shopName:    createForm.shop,
        approvedAt:  new Date().toISOString(),
        createdBy:   'Admin',
      })

      // Write approval notification so agent sees a banner on next login
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'approval_notifications', cred.user.uid), {
        agentName:  createForm.name.trim(),
        email:      createForm.email.trim().toLowerCase(),
        dismissed:  false,
        approvedAt: new Date().toISOString(),
      })

      setToast({ message: 'Agent account created successfully!', type: 'success' })
      setCreateForm({ name: '', email: '', pass: '', area: '', shop: '' })
    } catch (err) {
      setToast({ message: authErrorMessage(err), type: 'error' })
    } finally { setLoading(false) }
  }

  const handleApprove = async req => {
    if (!req.passwordHint || req.passwordHint.length < 6) {
      setToast({ message: 'Cannot approve — password in request is missing or too short. Ask the agent to re-apply.', type: 'error' })
      return
    }
    try {
      // Create real Firebase Auth account using secondary app (keeps admin session intact)
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        req.email.trim().toLowerCase(),
        req.passwordHint
      )
      await updateProfile(cred.user, { displayName: req.agentName })
      // Sign out of secondary app — we only needed it for account creation
      await signOut(secondaryAuth)

      // Store profile in Firestore (NO password)
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', cred.user.uid), {
        uid:         cred.user.uid,
        email:       req.email.trim().toLowerCase(),
        agentName:   req.agentName,
        areaManager: req.areaManager,
        shopName:    req.shopName,
        approvedAt:  new Date().toISOString(),
      })

      // Write approval notification — agent sees a welcome banner on next login
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'approval_notifications', cred.user.uid), {
        agentName:  req.agentName,
        email:      req.email.trim().toLowerCase(),
        dismissed:  false,
        approvedAt: new Date().toISOString(),
      })

      // Delete the request (removes the temporary passwordHint from Firestore)
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'requests', req.id))
      setToast({ message: `Agent "${req.agentName}" approved — account is now active!`, type: 'success' })
    } catch (err) {
      setToast({ message: authErrorMessage(err), type: 'error' })
    }
  }

  const handleReject = async id => {
    if (!confirm('Reject this application?')) return
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'requests', id))
    setToast({ message: 'Application rejected', type: 'error' })
  }

  const handleDeleteUser = async id => {
    if (!confirm("Remove this agent's access permanently?")) return
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', id))
    setToast({ message: 'Agent removed', type: 'error' })
  }

  const handleDeleteMaterial = async id => {
    if (!confirm('Delete this resource permanently?')) return
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'materials', id))
    setToast({ message: 'Resource deleted', type: 'error' })
  }

  // ── Shop / Manager management ──────────────────────────────────────────────
  const handleAddManager = async e => {
    e.preventDefault()
    const name = newManager.trim()
    if (!name) return
    // Check duplicate
    if (managers.includes(name)) { setToast({ message: 'Manager already exists', type: 'error' }); return }
    try {
      // We store a placeholder shop entry for the manager so it appears in the list
      // Admin can then add shops to it
      const id = 'mgr_' + Date.now().toString()
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'shops', id), {
        areaManager: name,
        shopName: '— (placeholder, add shops below)',
        createdAt: new Date().toISOString(),
        isPlaceholder: true,
      })
      setToast({ message: `Manager "${name}" added`, type: 'success' })
      setNewManager('')
    } catch (err) { setToast({ message: 'Failed: ' + err.message, type: 'error' }) }
  }

  const handleAddShop = async e => {
    e.preventDefault()
    const name = newShop.trim()
    if (!name || !shopArea) { setToast({ message: 'Select manager and enter shop name', type: 'error' }); return }
    try {
      const id = 'shop_' + Date.now().toString()
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'shops', id), {
        areaManager: shopArea, shopName: name, createdAt: new Date().toISOString(),
      })
      // Remove placeholder for this manager if it exists
      const placeholder = state.shops.find(s => s.areaManager === shopArea && s.isPlaceholder)
      if (placeholder) {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'shops', placeholder.id))
      }
      setToast({ message: `Shop "${name}" added`, type: 'success' })
      setNewShop('')
    } catch (err) { setToast({ message: 'Failed: ' + err.message, type: 'error' }) }
  }

  const handleDeleteShop = async (shopId, shopName) => {
    if (!confirm(`Delete shop "${shopName}"?`)) return
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'shops', shopId))
    setToast({ message: 'Shop removed', type: 'error' })
  }

  const handleDeleteManager = async managerName => {
    const shopCount = state.shops.filter(s => s.areaManager === managerName && !s.isPlaceholder).length
    if (!confirm(`Delete manager "${managerName}" and all ${shopCount} shop(s)?`)) return
    const toDelete = state.shops.filter(s => s.areaManager === managerName)
    await Promise.all(toDelete.map(s => deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'shops', s.id))))
    setToast({ message: 'Manager and shops removed', type: 'error' })
  }

  // ─── Layout helpers ────────────────────────────────────────────────────────
  const TABS = [
    { id: 'shops',      label: 'Shops & Managers', icon: 'store' },
    { id: 'users',      label: 'Agents',           icon: 'users' },
    { id: 'retailmap',  label: 'Retail Map',       icon: 'gitBranch' },
    { id: 'materials',  label: 'Resources',        icon: 'fileText' },
    { id: 'requests',   label: 'Requests',         icon: 'warning', badge: state.requests.length },
  ]

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 20px', animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <div style={{
        marginBottom: 40, paddingBottom: 28,
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h2 style={{ fontFamily: ff, fontWeight: 900, fontSize: 42, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: dark ? '#fff' : '#111' }}>
            Management
          </h2>
          <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#ef4444', marginTop: 6 }}>
            Administrator Hub
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* ═══ LEFT SIDEBAR: Upload + Create Agent ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Upload resource */}
          <Card dark={dark}>
            <SectionHead dark={dark}>Upload Resource</SectionHead>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select value={uploadForm.cat} onChange={e => setUploadForm({ ...uploadForm, cat: e.target.value })} dark={dark}>
                {['medical','orange-info','corporate','incentives','heroes','events','activities'].map(c =>
                  <option key={c} value={c}>{c.replace(/-/g,' ').toUpperCase()}</option>
                )}
              </Select>
              <Input placeholder="Resource Title" value={uploadForm.title}
                onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} required dark={dark} />
              <label htmlFor="admin-file" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '18px', border: `2px dashed ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.2s', gap: 6,
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              >
                <Icon name="upload" size={20} style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
                <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                  {fileName || 'Select File (< 750KB)'}
                </span>
                <input id="admin-file" type="file" onChange={handleFileSelect}
                  accept="image/*,video/*,application/pdf" style={{ display: 'none' }} />
              </label>
              <div style={{ display: 'flex', gap: 16, paddingLeft: 4 }}>
                {['photo','video','pdf'].map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: ff, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    <input type="radio" name="upload-type" value={t} checked={uploadForm.type === t}
                      onChange={() => setUploadForm({ ...uploadForm, type: t })} />
                    {t}
                  </label>
                ))}
              </div>
              <Btn type="submit" color="red" full disabled={loading}>
                {loading ? 'Publishing…' : 'Publish Resource'}
              </Btn>
            </form>
          </Card>

          {/* Create agent */}
          <Card dark={dark}>
            <SectionHead dark={dark} accent>Create Agent Account</SectionHead>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input placeholder="Full Name" value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required dark={dark} />
              <Input type="email" placeholder="Email" value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required dark={dark} />
              <Input placeholder="Set Password" value={createForm.pass}
                onChange={e => setCreateForm({ ...createForm, pass: e.target.value })} required dark={dark} />
              <Select value={createForm.area} onChange={e => setCreateForm({ ...createForm, area: e.target.value, shop: '' })} dark={dark}>
                <option value="">SELECT AREA</option>
                {managers.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Select value={createForm.shop} onChange={e => setCreateForm({ ...createForm, shop: e.target.value })} dark={dark} disabled={!createForm.area}>
                <option value="">SELECT SHOP</option>
                {shopsForCreate.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Btn type="submit" color="red" full disabled={loading}>
                {loading ? 'Creating…' : 'Create Agent Account'}
              </Btn>
            </form>
          </Card>
        </div>

        {/* ═══ RIGHT: Tabbed panel ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 14, padding: 4, width: '100%', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: '1 1 auto',
                padding: '9px 16px',
                background: tab === t.id ? (dark ? '#fff' : '#111') : 'transparent',
                color: tab === t.id ? (dark ? '#111' : '#fff') : (dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
                border: 'none', cursor: 'pointer', borderRadius: 10,
                fontFamily: ff, fontWeight: 800, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                whiteSpace: 'nowrap',
              }}>
                <Icon name={t.icon} size={13} />
                {t.label}
                {t.badge > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: Shops & Managers ── */}
          {tab === 'shops' && (
            <Card dark={dark}>
              <SectionHead dark={dark}>Shops &amp; Area Managers</SectionHead>

              {/* Add new manager */}
              <div style={{ marginBottom: 24, padding: 16, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 12, border: `1px dashed ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', marginBottom: 10 }}>
                  + Add New Area Manager
                </p>
                <form onSubmit={handleAddManager} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Input placeholder="Manager Full Name" value={newManager}
                      onChange={e => setNewManager(e.target.value)} required dark={dark} />
                  </div>
                  <Btn type="submit" color="black" small><Icon name="plus" size={14} /> Add</Btn>
                </form>
              </div>

              {/* Add new shop */}
              <div style={{ marginBottom: 28, padding: 16, background: dark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.03)', borderRadius: 12, border: '1px dashed rgba(239,68,68,0.2)' }}>
                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ef4444', marginBottom: 10 }}>
                  + Add Shop to Manager
                </p>
                <form onSubmit={handleAddShop} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <Select value={shopArea} onChange={e => setShopArea(e.target.value)} dark={dark}>
                      <option value="">SELECT MANAGER</option>
                      {managers.map(m => <option key={m} value={m}>{m}</option>)}
                    </Select>
                  </div>
                  <div style={{ flex: '1 1 160px' }}>
                    <Input placeholder="Shop Name" value={newShop}
                      onChange={e => setNewShop(e.target.value)} required dark={dark} />
                  </div>
                  <Btn type="submit" color="red" small><Icon name="plus" size={14} /> Add</Btn>
                </form>
              </div>

              {/* Manager list */}
              {managers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.3)' }}>
                  No managers yet — add one above
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {managers.map(manager => {
                  const managerShops = state.shops.filter(s => s.areaManager === manager && !s.isPlaceholder)
                  return (
                    <div key={manager} style={{ borderRadius: 14, border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, overflow: 'hidden' }}>
                      {/* Manager header */}
                      <div style={{
                        padding: '14px 18px', background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <p style={{ fontFamily: ff, fontWeight: 900, fontSize: 15, textTransform: 'uppercase', margin: 0, color: dark ? '#fff' : '#111' }}>
                            {manager}
                          </p>
                          <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ef4444', margin: '3px 0 0' }}>
                            {managerShops.length} Shop{managerShops.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteManager(manager)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(128,128,128,0.3)', transition: 'color 0.2s', padding: 6,
                        }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(128,128,128,0.3)'}
                          title="Delete manager and all shops"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                      {/* Shops */}
                      {managerShops.length > 0 && (
                        <div style={{ padding: '10px 18px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {managerShops.map(s => (
                            <div key={s.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                              borderRadius: 8, padding: '5px 10px 5px 12px',
                            }}>
                              <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: dark ? '#ddd' : '#333' }}>
                                {s.shopName}
                              </span>
                              <button onClick={() => handleDeleteShop(s.id, s.shopName)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(128,128,128,0.35)', display: 'flex', padding: 2,
                                transition: 'color 0.2s',
                              }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(128,128,128,0.35)'}
                              >
                                <Icon name="x" size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {managerShops.length === 0 && (
                        <p style={{ fontFamily: ff, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.35)', padding: '10px 18px' }}>
                          No shops yet — add above
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* ── TAB: Agents ── */}
          {tab === 'users' && (
            <Card dark={dark}>
              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: '1 1 180px' }}>
                  <Input placeholder="Search name or email…" value={fSearch}
                    onChange={e => setFSearch(e.target.value.toLowerCase())} dark={dark} />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <Select value={fArea} onChange={e => { setFArea(e.target.value); setFShop('') }} dark={dark}>
                    <option value="">ALL MANAGERS</option>
                    {managers.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <Select value={fShop} onChange={e => setFShop(e.target.value)} dark={dark} disabled={!fArea}>
                    <option value="">ALL SHOPS</option>
                    {shopsForFilter.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <button onClick={() => { setFSearch(''); setFArea(''); setFShop('') }} style={{
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', color: dark ? '#fff' : '#111',
                }}>
                  <Icon name="rotate" size={16} />
                </button>
              </div>
              <SectionHead dark={dark} accent>
                {filteredUsers.length} Agent{filteredUsers.length !== 1 ? 's' : ''} Found
              </SectionHead>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {filteredUsers.map(u => (
                  <div key={u.id} style={{
                    padding: '14px 16px', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', margin: 0, color: dark ? '#fff' : '#111' }}>{u.agentName}</p>
                      <p style={{ fontFamily: ff, fontWeight: 500, fontSize: 10, color: 'rgba(128,128,128,0.6)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#ef4444', margin: 0 }}>{u.shopName}</p>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(128,128,128,0.35)', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(128,128,128,0.35)'}
                    >
                      <Icon name="userX" size={16} />
                    </button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.3)' }}>
                    No agents match filters
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── TAB: Retail Map ── */}
          {tab === 'retailmap' && (
            <RetailMapAdmin
              dark={dark}
              retailMap={state.retailMap || []}
              areas={state.shops}
              setToast={setToast}
            />
          )}

          {/* ── TAB: Materials ── */}
          {tab === 'materials' && (
            <Card dark={dark}>
              <SectionHead dark={dark}>Platform Resources ({allMaterials.length})</SectionHead>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {allMaterials.map(m => (
                  <div key={m.id} style={{
                    padding: '12px 16px', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', margin: 0, color: dark ? '#fff' : '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                      <p style={{ fontFamily: ff, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(128,128,128,0.5)', margin: '2px 0 0' }}>{m.category}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => onView(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(128,128,128,0.4)' }}
                        onMouseEnter={e => e.currentTarget.style.color = dark ? '#fff' : '#111'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(128,128,128,0.4)'}
                      ><Icon name="eye" size={15} /></button>
                      <button onClick={() => handleDeleteMaterial(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(128,128,128,0.4)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(128,128,128,0.4)'}
                      ><Icon name="trash" size={15} /></button>
                    </div>
                  </div>
                ))}
                {allMaterials.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.3)' }}>
                    No resources uploaded yet
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── TAB: Requests ── */}
          {tab === 'requests' && (
            <Card dark={dark} style={{ border: state.requests.length > 0 ? '1px solid rgba(239,68,68,0.35)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <SectionHead dark={dark} accent>Pending Applications</SectionHead>
                {state.requests.length > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, padding: '2px 12px', fontFamily: ff, fontWeight: 900, fontSize: 12 }}>
                    {state.requests.length}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {state.requests.map(req => (
                  <div key={req.id} style={{
                    padding: '16px 20px',
                    background: dark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
                    borderRadius: 12, border: '1px solid rgba(239,68,68,0.14)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                  }}>
                    <div>
                      <p style={{ fontFamily: ff, fontWeight: 900, fontSize: 15, textTransform: 'uppercase', margin: 0, color: dark ? '#fff' : '#111' }}>{req.agentName}</p>
                      <p style={{ fontFamily: ff, fontSize: 11, color: 'rgba(128,128,128,0.6)', margin: '2px 0' }}>{req.email}</p>
                      <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#ef4444', margin: 0 }}>
                        {req.shopName} — {req.areaManager}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApprove(req)} style={{
                        background: 'rgba(34,197,94,0.1)', border: 'none', cursor: 'pointer',
                        color: '#22c55e', borderRadius: 8, padding: '8px 12px', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: ff, fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#22c55e'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; e.currentTarget.style.color = '#22c55e' }}
                      >
                        <Icon name="check" size={14} /> Approve
                      </button>
                      <button onClick={() => handleReject(req.id)} style={{
                        background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer',
                        color: '#ef4444', borderRadius: 8, padding: '8px 12px', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: ff, fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
                      >
                        <Icon name="x" size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {state.requests.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.3)' }}>
                    No pending applications
                  </div>
                )}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
