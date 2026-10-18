import { useEffect, useMemo, useState } from 'react'
import {
  FiBell,
  FiEye,
  FiGift,
  FiInfo,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiStar,
  FiTag,
  FiTrash2,
  FiUploadCloud,
  FiUserCheck,
  FiUsers,
  FiX,
  FiZap,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Tabs } from '../../../components/ui/Tabs'
import { useLanguage } from '../../../contexts/useLanguage'
import { supabase } from '../../../services/supabaseClient'
import { storageService } from '../../../services/storageService'
import { formatDate } from '../../transfers/transferUtils'
import { addToast } from '../../ui/uiSlice'
import { CARD } from '../adminConfig'
import { adminText } from '../adminI18n'
import {
  BADGE_PALETTES,
  NotificationBadgeIcon,
} from '../../communications/NotificationBottomSheet'

const BADGE_COLOR_OPTIONS = [
  { id: 'brand', label: 'Sarcelle (Brand)', bg: '#0f766e' },
  { id: 'emerald', label: 'Émeraude', bg: '#10b981' },
  { id: 'amber', label: 'Ambre', bg: '#f59e0b' },
  { id: 'rose', label: 'Rose / Rouge', bg: '#f43f5e' },
  { id: 'violet', label: 'Violet', bg: '#8b5cf6' },
  { id: 'sky', label: 'Bleu ciel', bg: '#0ea5e9' },
  { id: 'slate', label: 'Ardoise', bg: '#64748b' },
]

const BADGE_ICON_OPTIONS = [
  { id: 'bell', label: 'Cloche', icon: FiBell },
  { id: 'zap', label: 'Éclair', icon: FiZap },
  { id: 'star', label: 'Étoile', icon: FiStar },
  { id: 'gift', label: 'Cadeau', icon: FiGift },
  { id: 'shield', label: 'Bouclier', icon: FiShield },
  { id: 'tag', label: 'Badge / Promo', icon: FiTag },
  { id: 'info', label: 'Info', icon: FiInfo },
]

const TARGET_TYPES = [
  { id: 'all', labelKey: 'admin.notifications.targetAll', icon: FiUsers },
  { id: 'role', labelKey: 'admin.notifications.targetRole', icon: FiShield },
  { id: 'country', labelKey: 'admin.notifications.targetCountry', icon: FiTag },
  { id: 'verified', labelKey: 'admin.notifications.targetVerified', icon: FiUserCheck },
  { id: 'custom', labelKey: 'admin.notifications.targetCustom', icon: FiUsers },
]

const ROLE_OPTIONS = [
  { id: 'user', label: 'Utilisateurs (Standard)' },
  { id: 'professional', label: 'Professionnels' },
  { id: 'moderator', label: 'Modérateurs' },
  { id: 'admin', label: 'Administrateurs' },
]

export function AdminNotificationCenter() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const allUsers = useSelector((state) => state.administration?.users || [])
  const currentUser = useSelector((state) => state.auth?.user)

  const [activeTab, setActiveTab] = useState('compose')
  const [targetType, setTargetType] = useState('all')
  const [selectedRole, setSelectedRole] = useState('user')
  const [targetCountry, setTargetCountry] = useState('RU')
  const [customUserIds, setCustomUserIds] = useState([])
  const [customUserSearch, setCustomUserSearch] = useState('')

  // Form Fields
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [priority, setPriority] = useState('normal')
  const [actionLabel, setActionLabel] = useState('')

  // Image & Media
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [_uploadingImage, setUploadingImage] = useState(false)
  const [showInMarketplace, setShowInMarketplace] = useState(true)

  // Badge Customizer
  const [badgeText, setBadgeText] = useState('')
  const [badgeColor, setBadgeColor] = useState('brand')
  const [badgeIcon, setBadgeIcon] = useState('bell')

  // Bottom Sheet Mode
  const [displayMode, setDisplayMode] = useState('sheet')

  // Preview Mode
  const [previewMode, setPreviewMode] = useState('card') // 'card' or 'sheet'

  // Submission State
  const [confirmingSend, setConfirmingSend] = useState(false)
  const [sending, setSending] = useState(false)

  const previewImageSrc = imagePreview || imageUrl || ''

  function handleImageSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      dispatch(
        addToast({
          title: 'Format non supporté',
          message: 'Veuillez sélectionner un fichier image valide.',
          tone: 'warning',
        }),
      )
      return
    }
    setImageFile(file)
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
  }

  function handleClearImage() {
    setImageFile(null)
    setImagePreview('')
    setImageUrl('')
  }

  // History State
  const [historyItems, setHistoryItems] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Audience Count Estimation
  const estimatedUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (u.status && ['suspended', 'banned', 'blocked', 'disabled', 'pending_deletion'].includes(u.status)) {
        return false
      }
      if (targetType === 'all') return true
      if (targetType === 'role') return u.role === selectedRole
      if (targetType === 'country') {
        const c = targetCountry.trim().toUpperCase()
        return (
          (u.country && u.country.toUpperCase() === c) ||
          (u.originCountry && u.originCountry.toUpperCase() === c)
        )
      }
      if (targetType === 'verified') {
        return Boolean(u.phoneVerified || u.verified || u.emailVerified || u.status === 'verified')
      }
      if (targetType === 'custom') {
        return customUserIds.includes(u.id)
      }
      return false
    })
  }, [allUsers, targetType, selectedRole, targetCountry, customUserIds])

  // Filtered Users for custom selection search
  const filteredUsersForPicker = useMemo(() => {
    if (!customUserSearch.trim()) return allUsers.slice(0, 15)
    const q = customUserSearch.toLowerCase()
    return allUsers
      .filter((u) =>
        `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u.role || ''}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 20)
  }, [allUsers, customUserSearch])

  // Load history on tab change
  useEffect(() => {
    if (activeTab === 'history') {
      loadBroadcastHistory()
    }
  }, [activeTab])

  async function loadBroadcastHistory() {
    if (!supabase) return
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase.rpc('moxt_admin_list_broadcasts', { p_limit: 40 })
      if (!error && data) {
        setHistoryItems(data)
      } else {
        // Fallback: direct table query if RPC is pending
        const { data: rows } = await supabase
          .from('admin_broadcasts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(40)
        setHistoryItems(rows || [])
      }
    } catch {
      // offline / mock fallback
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleSendBroadcast() {
    if (!title.trim() || !message.trim()) {
      dispatch(
        addToast({
          title: 'Champs requis',
          message: 'Veuillez renseigner un titre et un message.',
          tone: 'warning',
        }),
      )
      return
    }

    setSending(true)
    try {
      let finalImageUrl = imageUrl.trim()
      if (imageFile) {
        setUploadingImage(true)
        try {
          finalImageUrl = await storageService.uploadBroadcastImage(currentUser?.id, imageFile)
        } catch (uploadErr) {
          console.error('Broadcast image upload failed:', uploadErr)
          dispatch(
            addToast({
              title: 'Erreur d’image',
              message: 'Impossible de télécharger l’image. Vérifiez votre connexion.',
              tone: 'error',
            }),
          )
          setSending(false)
          setUploadingImage(false)
          return
        } finally {
          setUploadingImage(false)
        }
      }

      const targetFilter = {}
      if (targetType === 'role') targetFilter.role = selectedRole
      if (targetType === 'country') targetFilter.country = targetCountry.trim().toUpperCase()
      if (targetType === 'custom') targetFilter.userIds = customUserIds
      if (finalImageUrl) {
        targetFilter.imageUrl = finalImageUrl
        targetFilter.bannerUrl = finalImageUrl
      }
      if (showInMarketplace) {
        targetFilter.showInMarketplace = true
      }

      let recipientCount = 0

      if (supabase) {
        const { data, error } = await supabase.rpc('moxt_admin_broadcast_notification', {
          p_title: title.trim(),
          p_message: message.trim(),
          p_target_type: targetType,
          p_target_filter: targetFilter,
          p_badge_text: badgeText.trim() || null,
          p_badge_color: badgeColor,
          p_badge_icon: badgeIcon,
          p_display_mode: displayMode,
          p_action_label: actionLabel.trim() || null,
          p_link: link.trim() || null,
          p_priority: priority,
        })

        if (error) {
          throw error
        }
        recipientCount = data?.recipientCount || estimatedUsers.length
      } else {
        recipientCount = estimatedUsers.length
      }

      dispatch(
        addToast({
          title: adminText(t, 'admin.notifications.successTitle'),
          message: adminText(t, 'admin.notifications.successBody', { count: recipientCount }),
          tone: 'success',
        }),
      )

      // Reset form
      setTitle('')
      setMessage('')
      setLink('')
      setBadgeText('')
      setActionLabel('')
      setImageUrl('')
      setImageFile(null)
      setImagePreview('')
      setConfirmingSend(false)
      setActiveTab('history')
    } catch (err) {
      dispatch(
        addToast({
          title: 'Échec de la diffusion',
          message: err?.message || 'Erreur lors de l’envoi de la notification.',
          tone: 'error',
        }),
      )
    } finally {
      setSending(false)
    }
  }

  const selectedPalette = BADGE_PALETTES[badgeColor] || BADGE_PALETTES.brand

  return (
    <div className="grid gap-6">
      {/* Header card */}
      <Card className={`${CARD} grid gap-3 p-5 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                <FiBell className="text-lg" />
              </span>
              <h2 className="text-xl font-black text-[var(--app-text)]">
                {adminText(t, 'admin.notifications.title')}
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-[var(--app-text-muted)]">
              {adminText(t, 'admin.notifications.description')}
            </p>
          </div>

          <Tabs
            active={activeTab}
            label="Centre de diffusions"
            onChange={setActiveTab}
            items={[
              { value: 'compose', label: adminText(t, 'admin.notifications.tabCompose') },
              { value: 'history', label: adminText(t, 'admin.notifications.tabHistory') },
            ]}
          />
        </div>
      </Card>

      {activeTab === 'compose' && (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Main Compose Form */}
          <div className="grid gap-6 lg:col-span-7">
            {/* 1. Target Audience */}
            <Card className={`${CARD} grid gap-4 p-5`}>
              <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
                <h3 className="font-black text-[var(--app-text)]">
                  {adminText(t, 'admin.notifications.audienceTitle')}
                </h3>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {adminText(t, 'admin.notifications.estimatedAudience', {
                    count: estimatedUsers.length,
                  })}
                </span>
              </div>

              {/* Target Pills */}
              <div className="flex flex-wrap gap-2">
                {TARGET_TYPES.map((type) => {
                  const Icon = type.icon
                  const active = targetType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setTargetType(type.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                          : 'border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:border-brand-300'
                      }`}
                    >
                      <Icon className="text-sm" />
                      {adminText(t, type.labelKey)}
                    </button>
                  )
                })}
              </div>

              {/* Target Sub-Options */}
              {targetType === 'role' && (
                <div className="mt-2 grid gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <label className="text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.targetRoleSelect')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`rounded-lg p-2 text-center text-xs font-bold transition ${
                          selectedRole === r.id
                            ? 'bg-brand-600 text-white'
                            : 'bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {targetType === 'country' && (
                <div className="mt-2 grid gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <label className="text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.targetCountrySelect')}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {['RU', 'CM', 'CI', 'SN', 'CD', 'FR'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setTargetCountry(code)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          targetCountry === code
                            ? 'bg-brand-600 text-white'
                            : 'bg-[var(--app-surface)] text-[var(--app-text)]'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                    <input
                      type="text"
                      maxLength={3}
                      value={targetCountry}
                      onChange={(e) => setTargetCountry(e.target.value.toUpperCase())}
                      placeholder="Autre..."
                      className="w-24 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-xs font-bold uppercase"
                    />
                  </div>
                </div>
              )}

              {targetType === 'custom' && (
                <div className="mt-2 grid gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <label className="text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.targetCustomSelect')} ({customUserIds.length}{' '}
                    sélectionné(s))
                  </label>
                  <input
                    type="search"
                    placeholder="Chercher par nom ou email..."
                    value={customUserSearch}
                    onChange={(e) => setCustomUserSearch(e.target.value)}
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs"
                  />
                  <div className="max-h-40 overflow-y-auto overscroll-contain pr-1">
                    <div className="grid gap-1">
                      {filteredUsersForPicker.map((u) => {
                        const selected = customUserIds.includes(u.id)
                        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                setCustomUserIds(customUserIds.filter((id) => id !== u.id))
                              } else {
                                setCustomUserIds([...customUserIds, u.id])
                              }
                            }}
                            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                              selected
                                ? 'bg-brand-50 text-brand-900 dark:bg-brand-950/60 dark:text-brand-200'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate font-semibold">{name}</span>
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {selected ? '✓ Sélectionné' : '+ Ajouter'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 2. Notification Content */}
            <Card className={`${CARD} grid gap-4 p-5`}>
              <h3 className="border-b border-[var(--app-border)] pb-3 font-black text-[var(--app-text)]">
                {adminText(t, 'admin.notifications.contentTitle')}
              </h3>

              <div className="grid gap-3">
                <div>
                  <label className="block text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.fieldTitle')} *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={adminText(t, 'admin.notifications.fieldTitlePlaceholder')}
                    maxLength={140}
                    className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2.5 text-sm font-bold text-[var(--app-text)] focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.fieldMessage')} *
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={adminText(t, 'admin.notifications.fieldMessagePlaceholder')}
                    maxLength={1500}
                    className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2.5 text-sm text-[var(--app-text)] focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black text-[var(--app-text)]">
                      {adminText(t, 'admin.notifications.fieldLink')}
                    </label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder={adminText(t, 'admin.notifications.fieldLinkPlaceholder')}
                      className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-text)] focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[var(--app-text)]">
                      {adminText(t, 'admin.notifications.fieldActionLabel')}
                    </label>
                    <input
                      type="text"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      placeholder={adminText(t, 'admin.notifications.fieldActionPlaceholder')}
                      maxLength={40}
                      className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-text)] focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Image / Bannière de diffusion */}
                <div>
                  <label className="block text-xs font-black text-[var(--app-text)]">
                    Image / Bannière de diffusion (optionnel)
                  </label>
                  <p className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">
                    Téléchargez une image ou bannière (PNG, JPG, WebP) qui s’affichera dans le tiroir d’alerte et entre les annonces de la Marketplace.
                  </p>

                  {previewImageSrc ? (
                    <div className="relative mt-2 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]">
                      <img
                        src={previewImageSrc}
                        alt="Aperçu diffusion"
                        className="max-h-48 w-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="rounded-full bg-slate-900/80 p-1.5 text-white shadow-md backdrop-blur-sm hover:bg-rose-600 transition"
                          aria-label="Supprimer l’image"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col gap-2">
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-center transition hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-brand-950/20">
                        <FiUploadCloud className="text-2xl text-brand-600 mb-1" />
                        <span className="text-xs font-bold text-[var(--app-text)]">
                          Cliquer pour choisir une image ou glisser-déposer
                        </span>
                        <span className="mt-0.5 text-[10px] text-[var(--app-text-muted)]">
                          PNG, JPG, WEBP jusqu’à 10 Mo (redimensionnée et optimisée)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>

                      {/* URL directe optionnelle */}
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value)
                          if (!imageFile) setImagePreview(e.target.value)
                        }}
                        placeholder="Ou coller une URL d’image directe (https://...)"
                        className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs text-[var(--app-text)] focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Toggle Insertion Marketplace */}
                  <label className="mt-3 flex items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 cursor-pointer">
                    <div className="pr-3">
                      <span className="text-xs font-black text-[var(--app-text)]">
                        Diffuser en bannière sur la Marketplace
                      </span>
                      <p className="text-[11px] text-[var(--app-text-muted)]">
                        Insère automatiquement cette annonce/promotion entre les lignes d’annonces sur petit écran.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showInMarketplace}
                      onChange={(e) => setShowInMarketplace(e.target.checked)}
                      className="size-4 rounded accent-brand-600 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="block text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.fieldPriority')}
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {[
                      { id: 'normal', label: adminText(t, 'admin.notifications.priorityNormal') },
                      { id: 'high', label: adminText(t, 'admin.notifications.priorityHigh') },
                      { id: 'low', label: adminText(t, 'admin.notifications.priorityLow') },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          priority === p.id
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Customizable Badge & Display Mode */}
            <Card className={`${CARD} grid gap-4 p-5`}>
              <h3 className="border-b border-[var(--app-border)] pb-3 font-black text-[var(--app-text)]">
                {adminText(t, 'admin.notifications.badgeTitle')}
              </h3>

              <div className="grid gap-4">
                <div>
                  <label className="block text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.fieldBadgeText')}
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value.toUpperCase())}
                    placeholder={adminText(t, 'admin.notifications.fieldBadgeTextPlaceholder')}
                    maxLength={16}
                    className="mt-1 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-xs font-black tracking-wider text-[var(--app-text)] uppercase focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Badge Color Palette */}
                <div>
                  <label className="block text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.fieldBadgeColor')}
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {BADGE_COLOR_OPTIONS.map((c) => {
                      const active = badgeColor === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setBadgeColor(c.id)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-brand-500 ring-2 ring-brand-500/30'
                              : 'border-[var(--app-border)] bg-[var(--app-surface)]'
                          }`}
                        >
                          <span
                            className="size-3.5 rounded-full shadow-sm"
                            style={{ backgroundColor: c.bg }}
                          />
                          <span>{c.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Badge Icon Selector */}
                <div>
                  <label className="block text-xs font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.fieldBadgeIcon')}
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {BADGE_ICON_OPTIONS.map((ic) => {
                      const Icon = ic.icon
                      const active = badgeIcon === ic.id
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setBadgeIcon(ic.id)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                              : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]'
                          }`}
                        >
                          <Icon className="text-sm" />
                          <span>{ic.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Display Mode: Bottom Sheet Toggle */}
                <div className="mt-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-[var(--app-text)]">
                        {adminText(t, 'admin.notifications.fieldDisplayMode')}
                      </h4>
                      <p className="mt-1 text-xs text-[var(--app-text-muted)] leading-relaxed">
                        {adminText(t, 'admin.notifications.fieldDisplayModeHint')}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={displayMode === 'sheet'}
                      onClick={() => setDisplayMode(displayMode === 'sheet' ? 'standard' : 'sheet')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        displayMode === 'sheet' ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          displayMode === 'sheet' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Broadcast action button */}
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="primary"
                icon={FiSend}
                disabled={!title.trim() || !message.trim() || sending}
                loading={sending}
                onClick={() => setConfirmingSend(true)}
              >
                {adminText(t, 'admin.notifications.sendButton')}
              </Button>

              <span className="text-xs text-[var(--app-text-muted)]">
                {adminText(t, 'admin.notifications.estimatedAudience', {
                  count: estimatedUsers.length,
                })}
              </span>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="sticky top-6 grid gap-4 lg:col-span-5">
            <Card className={`${CARD} p-5`}>
              <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
                <div className="flex items-center gap-2">
                  <FiEye className="text-brand-600" />
                  <h3 className="font-black text-[var(--app-text)]">
                    {adminText(t, 'admin.notifications.previewTitle')}
                  </h3>
                </div>

                <div className="flex rounded-xl bg-[var(--app-surface-muted)] p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('card')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      previewMode === 'card'
                        ? 'bg-[var(--app-surface)] text-brand-700 shadow-sm'
                        : 'text-[var(--app-text-muted)]'
                    }`}
                  >
                    Carte
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sheet')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      previewMode === 'sheet'
                        ? 'bg-[var(--app-surface)] text-brand-700 shadow-sm'
                        : 'text-[var(--app-text-muted)]'
                    }`}
                  >
                    Tiroir (Sheet)
                  </button>
                </div>
              </div>

              {/* Live Preview Container */}
              <div className="mt-4">
                {previewMode === 'card' ? (
                  /* Notification Card Preview */
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
                    {previewImageSrc ? (
                      <div className="mb-3 overflow-hidden rounded-xl border border-[var(--app-border)] bg-slate-100 dark:bg-slate-800">
                        <img
                          src={previewImageSrc}
                          alt="Aperçu"
                          className="max-h-36 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-start gap-3">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${selectedPalette.iconBg}`}>
                        <NotificationBadgeIcon name={badgeIcon} className="text-sm" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-sm font-black text-[var(--app-text)]">
                            {title || 'Titre de la notification'}
                          </strong>
                          <div className="flex flex-wrap gap-1.5">
                            {badgeText ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${selectedPalette.badge}`}
                              >
                                <span className={`size-1.5 rounded-full ${selectedPalette.dot}`} />
                                {badgeText}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-black text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                              {priority.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <p className="mt-1.5 text-xs text-[var(--app-text-muted)] line-clamp-3 leading-relaxed">
                          {message || 'Le corps complet de votre message apparaîtra ici avec mise en page...'}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--app-border)] pt-2.5">
                          <span className="text-[10px] text-slate-400">À l’instant</span>
                          <span className="rounded-lg bg-brand-500/10 px-2.5 py-1 text-[11px] font-black text-brand-700 dark:text-brand-300">
                            {actionLabel || (displayMode === 'sheet' ? 'Voir l’alerte' : 'Ouvrir')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Bottom Sheet Preview Simulation */
                  <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-slate-900/10 p-2 dark:bg-slate-950/40">
                    <div className="rounded-t-2xl border border-b-0 border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-xl">
                      {/* Sheet Handle */}
                      <div className="flex justify-center pb-2">
                        <span className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
                      </div>

                      {/* Sheet Header */}
                      <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`grid size-7 place-items-center rounded-lg ${selectedPalette.iconBg}`}
                          >
                            <NotificationBadgeIcon name={badgeIcon} className="text-xs" />
                          </span>
                          <span className="text-[11px] font-black uppercase text-[var(--app-text-muted)]">
                            {priority === 'high' ? 'Urgent' : priority === 'low' ? 'Info' : 'Standard'}
                          </span>
                        </div>
                        <FiX className="text-slate-400" />
                      </div>

                      {/* Sheet Body */}
                      <div className="py-3">
                        {previewImageSrc ? (
                          <div className="mb-3 overflow-hidden rounded-xl border border-[var(--app-border)] bg-slate-100 dark:bg-slate-800">
                            <img
                              src={previewImageSrc}
                              alt="Aperçu"
                              className="max-h-40 w-full object-cover"
                            />
                          </div>
                        ) : null}

                        {badgeText ? (
                          <div className="mb-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase">
                            <span className={`size-1.5 rounded-full ${selectedPalette.dot}`} />
                            <span className={selectedPalette.badge}>{badgeText}</span>
                          </div>
                        ) : null}

                        <h4 className="text-base font-black text-[var(--app-text)]">
                          {title || 'Titre de la notification'}
                        </h4>
                        <p className="mt-0.5 text-[10px] text-[var(--app-text-muted)]">
                          {new Date().toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>

                        <div className="mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                          <p className="text-xs text-[var(--app-text)] leading-relaxed">
                            {message || 'Le corps détaillé de votre message s’affichera avec toute sa mise en forme...'}
                          </p>
                        </div>
                      </div>

                      {/* Sheet Footer Action */}
                      <div className="border-t border-[var(--app-border)] pt-3">
                        <div className="grid h-9 place-items-center rounded-xl bg-brand-600 text-xs font-black text-white shadow-sm">
                          {actionLabel || 'Ouvrir'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className={`${CARD} p-5`}>
          <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-4">
            <div>
              <h3 className="font-black text-[var(--app-text)]">
                {adminText(t, 'admin.notifications.tabHistory')}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                Historique des notifications diffusées et taux d’ouverture
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={FiRefreshCw}
              loading={historyLoading}
              onClick={loadBroadcastHistory}
            >
              Actualiser
            </Button>
          </div>

          <div className="mt-4">
            {historyItems.length ? (
              <div className="grid gap-3">
                {historyItems.map((item) => {
                  const palette = BADGE_PALETTES[item.badge_color || item.badgeColor || 'brand'] || BADGE_PALETTES.brand
                  const recipients = Number(item.recipient_count || item.recipientCount || 0)
                  const reads = Number(item.read_count || item.readCount || 0)
                  const rate = recipients > 0 ? Math.round((reads / recipients) * 100) : 0
                  const itemImage =
                    item.target_filter?.imageUrl ||
                    item.target_filter?.bannerUrl ||
                    item.targetFilter?.imageUrl ||
                    item.targetFilter?.bannerUrl ||
                    item.imageUrl ||
                    null

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {itemImage ? (
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-[var(--app-border)] bg-slate-100 dark:bg-slate-800">
                            <img
                              src={itemImage}
                              alt={item.title}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${palette.iconBg}`}>
                            <NotificationBadgeIcon name={item.badge_icon || item.badgeIcon} className="text-sm" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm font-black text-[var(--app-text)]">
                              {item.title}
                            </strong>
                            {(item.badge_text || item.badgeText) ? (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${palette.badge}`}
                              >
                                {item.badge_text || item.badgeText}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {(item.display_mode || item.displayMode) === 'sheet' ? 'Tiroir bas' : 'Standard'}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-[var(--app-text-muted)] line-clamp-1">
                            {item.message}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            <span>{formatDate(item.created_at || item.createdAt)}</span>
                            <span>·</span>
                            <span>Cible : {item.target_type || item.targetType || 'all'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-xs font-black text-[var(--app-text)]">
                            {recipients} destinataire(s)
                          </p>
                          <p className="text-[11px] text-[var(--app-text-muted)]">
                            {reads} lu(s) ({rate}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[var(--app-text-muted)]">
                {historyLoading ? 'Chargement...' : adminText(t, 'admin.notifications.emptyHistory')}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmingSend}
        title={adminText(t, 'admin.notifications.confirmTitle')}
        description={adminText(t, 'admin.notifications.confirmBody', {
          count: estimatedUsers.length,
        })}
        onCancel={() => setConfirmingSend(false)}
        onConfirm={handleSendBroadcast}
        confirmLabel="Diffuser maintenant"
      />
    </div>
  )
}
