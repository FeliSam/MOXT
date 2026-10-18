import { supabase } from '../../../services/supabaseClient'
import { profileRowToAdminUser, setAdminUsers } from '../../administration/administrationSlice'
import { setProfileDirectory } from '../../profile/profileDirectorySlice'
import { setAll as setTransfers } from '../../transfers/transferSlice'
import { transferFromRemoteRow } from '../../transfers/transferRemote'
import { mergeRemoteAccount } from '../../account/accountSlice'
import { setAll as setBusinesses } from '../../businesses/businessSlice'
import { businessDocumentFromRemoteRow } from '../../businesses/businessRemote'
import { setRemoteAuditItems } from '../../audit/auditSlice'
import { setAll as setMarketplace } from '../../marketplace/marketplaceSlice'
import { loadAllData } from '../../../app/loadAllData'

/**
 * Synchronise immédiatement les éléments du tableau de bord d'administration
 * avec les données distantes fraîches de Supabase (profils utilisateurs, transferts,
 * vérifications, documents, journaux d'audit, signalements).
 */
export async function syncAdminDashboard(dispatch, { full = false } = {}) {
  if (!supabase) return false

  try {
    const [profilesRes, transfersRes, verifsRes, docsRes, auditsRes, reportsRes] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select(
          'id, first_name, last_name, email, phone, city, origin_country, country, role, status, phone_verified, phone_verified_at, email_verified, email_verified_at, avatar_url, created_at, updated_at',
        )
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('business_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('listing_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
    ])

    if (profilesRes.status === 'fulfilled' && Array.isArray(profilesRes.value.data)) {
      const rows = profilesRes.value.data
      const adminUsers = rows.map(profileRowToAdminUser).filter(Boolean)
      dispatch(setAdminUsers(adminUsers))
      dispatch(setProfileDirectory(rows))
    }

    if (transfersRes.status === 'fulfilled' && Array.isArray(transfersRes.value.data)) {
      const rows = transfersRes.value.data
      dispatch(setTransfers({ items: rows.map(transferFromRemoteRow).filter(Boolean) }))
    }

    if (verifsRes.status === 'fulfilled' && Array.isArray(verifsRes.value.data)) {
      dispatch(mergeRemoteAccount({ verificationRequests: verifsRes.value.data }))
    }

    if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value.data)) {
      const rows = docsRes.value.data
      dispatch(setBusinesses({ documents: rows.map(businessDocumentFromRemoteRow).filter(Boolean) }))
    }

    if (auditsRes.status === 'fulfilled' && Array.isArray(auditsRes.value.data)) {
      dispatch(setRemoteAuditItems(auditsRes.value.data))
    }

    if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value.data)) {
      dispatch(setMarketplace({ reports: reportsRes.value.data }))
    }

    if (full) {
      void dispatch(loadAllData())
    }

    return true
  } catch (error) {
    console.error('[MOXT] Erreur lors de l’actualisation du tableau de bord admin:', error)
    throw error
  }
}
