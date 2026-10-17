import { supabase } from './supabase';
import type { ListingItem } from '@/store/marketplace';
import type { TransferItem } from '@/store/transfers';
import type { ParcelItem } from '@/store/parcels';

export type AssistantResultCard = {
  id: string;
  type: 'listing' | 'transfer' | 'job' | 'parcel' | 'business';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  path: string;
  price?: string;
};

export type SmartAssistantResponse = {
  text: string;
  results: AssistantResultCard[];
  suggestions: string[];
};

type SearchContext = {
  listings: ListingItem[];
  transfers: TransferItem[];
  parcels: ParcelItem[];
  userId?: string | null;
};

/** Normalise une chaîne pour comparaison insensible à la casse et accents */
function clean(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Moteur intelligent pour Moxti :
 * 1. Détecte et traite les requêtes directes (articles du même nom, transferts effectués, jobs, colis, échangeurs).
 * 2. Prépare le contexte pour l'API Edge ai-assistant.
 */
export async function processSmartAssistantQuery(
  question: string,
  context: SearchContext,
  language = 'fr'
): Promise<SmartAssistantResponse> {
  const q = clean(question);

  // Charger les listings depuis Supabase si le store local est vide
  let allListings = context.listings;
  if (allListings.length === 0 && supabase) {
    try {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .limit(100);
      if (data && data.length) {
        allListings = data.map((l: any) => ({
          id: l.id,
          title: l.title || '',
          description: l.description || '',
          price: Number(l.price || 0),
          currency: l.currency || 'RUB',
          category: l.category || 'general',
          city: l.city || 'Russie',
          images: l.images || [],
          status: l.status || 'active',
          createdAt: l.created_at,
        }));
      }
    } catch {
      // safe fallback
    }
  }

  // 1. Détection : Articles / Annonces avec le même nom (Doublons ou variantes)
  const isDuplicateOrSameName =
    q.includes('meme nom') ||
    q.includes('meme titre') ||
    q.includes('meme article') ||
    q.includes('en double') ||
    q.includes('doublon') ||
    ((q.includes('identique') || q.includes('pareil') || q.includes('similaire')) &&
      (q.includes('article') || q.includes('annonce') || q.includes('produit') || q.includes('item') || q.includes('titre')));

  if (isDuplicateOrSameName) {
    const titleGroups: Record<string, ListingItem[]> = {};
    for (const item of allListings) {
      const normalizedTitle = clean(item.title);
      if (!normalizedTitle) continue;
      if (!titleGroups[normalizedTitle]) titleGroups[normalizedTitle] = [];
      titleGroups[normalizedTitle].push(item);
    }

    const duplicates = Object.entries(titleGroups).filter(([_, items]) => items.length > 1);

    if (duplicates.length > 0) {
      const totalDuplicates = duplicates.reduce((acc, [_, items]) => acc + items.length, 0);
      let text = `J'ai analysé le catalogue Marketplace : **${duplicates.length} groupe(s)** d'articles partagent exactement le même nom (total de ${totalDuplicates} annonces).\n\n`;

      const results: AssistantResultCard[] = [];

      for (const [title, items] of duplicates) {
        text += `• **${items[0].title}** : ${items.length} annonces disponibles\n`;
        for (const it of items) {
          results.push({
            id: it.id,
            type: 'listing',
            title: it.title,
            subtitle: `${it.price ? `${it.price} ${it.currency || '₽'}` : 'Prix sur demande'} · ${it.city || 'Partout'}`,
            badge: `${items.length} exemplaires`,
            badgeColor: '#f59e0b',
            path: `/listing/${it.id}`,
            price: it.price ? `${it.price} ${it.currency || '₽'}` : undefined,
          });
        }
      }

      return {
        text,
        results: results.slice(0, 8),
        suggestions: ['Voir les annonces récentes', 'Publier une nouvelle annonce', 'Vérifier mes transferts'],
      };
    } else {
      return {
        text: "Après vérification dans la base Marketplace, il n'y a actuellement aucun article portant le même nom. Toutes les annonces publiées ont des titres distincts.",
        results: [],
        suggestions: ['Lister les articles disponibles', 'Chercher un téléphone', 'Mes transferts'],
      };
    }
  }

  // 2. Détection : Recherche d'articles ou annonces par nom/catégorie
  const isMarketplaceSearch =
    q.includes('article') ||
    q.includes('annonce') ||
    q.includes('trouve') ||
    q.includes('cherche') ||
    q.includes('vendre') ||
    q.includes('acheter') ||
    q.includes('telephone') ||
    q.includes('iphone') ||
    q.includes('voiture');

  if (isMarketplaceSearch && !q.includes('transfert') && !q.includes('job') && !q.includes('colis') && !q.includes('changeur')) {
    const keywords = q
      .replace(/trouve|cherche|les|des|un|une|article|articles|annonce|annonces|qui|ont|le|la|de/g, '')
      .trim()
      .split(/\s+/)
      .filter((k) => k.length >= 2);

    const matches = allListings.filter((item) => {
      const hay = clean(`${item.title} ${item.description || ''} ${item.category || ''}`);
      return keywords.some((k) => hay.includes(k));
    });

    if (matches.length > 0) {
      const results: AssistantResultCard[] = matches.slice(0, 6).map((it) => ({
        id: it.id,
        type: 'listing',
        title: it.title,
        subtitle: `${it.price ? `${it.price} ${it.currency || '₽'}` : 'Sur demande'} · ${it.city || 'Russie'}`,
        badge: it.category || 'Marketplace',
        badgeColor: '#10b981',
        path: `/listing/${it.id}`,
        price: it.price ? `${it.price} ${it.currency || '₽'}` : undefined,
      }));

      return {
        text: `Voici ${matches.length} article(s) trouvé(s) sur le Marketplace correspondant à votre recherche :`,
        results,
        suggestions: ['Lister tous les articles', 'Filtrer par ville', 'Voir mes favoris'],
      };
    }
  }

  // 3. Détection : Recherche et suivi des transferts
  const isTransferQuery =
    q.includes('transfert') ||
    q.includes('virement') ||
    q.includes('mandat') ||
    q.includes('mxt') ||
    q.includes('envoyer argent') ||
    q.includes('paiement') ||
    q.includes('envoi d argent');

  if (isTransferQuery) {
    let userTransfers = context.transfers;

    // Si le store est vide, tenter de charger depuis Supabase
    if (userTransfers.length === 0 && context.userId && supabase) {
      try {
        const { data } = await supabase
          .from('transfers')
          .select('*')
          .eq('user_id', context.userId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data && data.length) {
          userTransfers = data.map((t: any) => ({
            id: t.id,
            status: t.status,
            amountSent: Number(t.amount_sent || t.amount || 0),
            currencyFrom: t.currency_from || 'RUB',
            currencyTo: t.currency_to || 'XOF',
            createdAt: t.created_at,
            recipient: { firstName: t.recipient_name },
          }));
        }
      } catch {
        // safe fallback
      }
    }

    if (userTransfers.length > 0) {
      const results: AssistantResultCard[] = userTransfers.slice(0, 5).map((t) => {
        const statusFr =
          t.status === 'completed' || t.status === 'paid_out'
            ? 'Payé'
            : t.status === 'pending' || t.status === 'processing'
            ? 'En cours'
            : t.status || 'Initié';
        const statusColor =
          statusFr === 'Payé' ? '#059669' : statusFr === 'En cours' ? '#d97706' : '#6366f1';

        const amountStr = t.amountSent ? `${t.amountSent.toLocaleString('fr-FR')} ${t.currencyFrom || 'RUB'}` : 'Montant N/A';
        const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

        return {
          id: t.id,
          type: 'transfer',
          title: `Transfert ${amountStr}`,
          subtitle: `${t.recipient?.firstName ? `Destinataire : ${t.recipient.firstName} · ` : ''}${dateStr}`,
          badge: statusFr,
          badgeColor: statusColor,
          path: `/transfer/${t.id}`,
          price: amountStr,
        };
      });

      return {
        text: `J'ai trouvé **${userTransfers.length} transfert(s)** dans votre compte. Cliquez sur une fiche pour ouvrir les détails ou le reçu :`,
        results,
        suggestions: ['Effectuer un nouveau transfert', 'Contacter l’échangeur', 'Télécharger un reçu'],
      };
    } else {
      return {
        text: "Vous n'avez aucun transfert récent enregistré sur ce compte. Vous pouvez initier un nouveau transfert sécurisé Afrique ↔ Russie dès maintenant.",
        results: [],
        suggestions: ['Nouveau transfert', 'Voir les taux de change', 'Liste des changeurs vérifiés'],
      };
    }
  }

  // 4. Détection : Emplois / Jobs
  const isJobQuery =
    q.includes('job') ||
    q.includes('emploi') ||
    q.includes('travail') ||
    q.includes('recrutement') ||
    q.includes('stage') ||
    q.includes('poste');

  if (isJobQuery) {
    let jobItems: any[] = [];
    if (supabase) {
      try {
        const { data } = await supabase.from('jobs').select('*').limit(6);
        if (data && data.length) jobItems = data;
      } catch {
        // fallback
      }
    }

    if (jobItems.length > 0) {
      const results: AssistantResultCard[] = jobItems.map((j) => ({
        id: j.id,
        type: 'job',
        title: j.title || 'Offre d’emploi',
        subtitle: `${j.company || j.publisher_name || 'Entreprise'} · ${j.city || j.location || 'Moscou'}`,
        badge: j.salary ? `${j.salary} ${j.currency || '₽'}` : 'Salaire négociable',
        badgeColor: '#0ea5e9',
        path: `/jobs/${j.id}`,
      }));

      return {
        text: `Voici **${jobItems.length} offre(s) d’emploi** actuellement disponibles au sein de la communauté MOXT :`,
        results,
        suggestions: ['Publier une offre de job', 'Chercher par ville', 'Voir les entreprises'],
      };
    } else {
      return {
        text: 'Découvrez nos opportunités professionnelles et offres d’emploi dans la rubrique dédiée Jobs de MOXT.',
        results: [],
        suggestions: ['Consulter les offres', 'Publier un emploi', 'Guide carrières'],
      };
    }
  }

  // 5. Détection : Colis et transport
  const isParcelQuery =
    q.includes('colis') ||
    q.includes('bagage') ||
    q.includes('kilo') ||
    q.includes('transport') ||
    q.includes('voyage');

  if (isParcelQuery) {
    let activeParcels = context.parcels.filter((p) => !p.status || p.status === 'active');
    if (activeParcels.length === 0 && supabase) {
      try {
        const { data } = await supabase
          .from('travel_parcels')
          .select('*')
          .order('departure_date', { ascending: true })
          .limit(6);
        if (data && data.length) {
          activeParcels = data.map((d: any) => ({
            id: d.id,
            origin: d.origin_city || d.origin_country || 'Afrique',
            destination: d.destination_city || d.destination_country || 'Russie',
            remainingKg: Number(d.capacity_kg || 10),
            pricePerKg: Number(d.price_per_kg || 0),
            status: 'active',
          })) as any;
        }
      } catch {
        // safe fallback
      }
    }

    if (activeParcels.length > 0) {
      const results: AssistantResultCard[] = activeParcels.slice(0, 5).map((p) => ({
        id: p.id,
        type: 'parcel',
        title: `${p.origin || 'Afrique'} → ${p.destination || 'Russie'}`,
        subtitle: `Reste ${p.remainingKg ?? p.capacityKg ?? 10} kg · ${p.pricePerKg ? `${p.pricePerKg} ₽/kg` : ''}`,
        badge: 'Voyage vérifié',
        badgeColor: '#10b981',
        path: `/parcel/${p.id}`,
      }));

      return {
        text: `Voici **${activeParcels.length} voyage(s) disponible(s)** pour l’envoi de vos colis :`,
        results,
        suggestions: ['Publier un voyage', 'Calculer le tarif colis', 'Suivi de colis'],
      };
    }
  }

  // 6. Détection : Changeurs / Échangeurs de devises
  const isExchangerQuery =
    q.includes('changeur') ||
    q.includes('echangeur') ||
    q.includes('bureau de change') ||
    q.includes('changer argent') ||
    q.includes('taux de change');

  if (isExchangerQuery && supabase) {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, city, is_verified, rating')
        .limit(5);
      if (data && data.length) {
        const results: AssistantResultCard[] = data.map((org: any) => ({
          id: org.id,
          type: 'business',
          title: org.name || 'Bureau de change',
          subtitle: `${org.city || 'Moscou'} · ${org.is_verified ? 'Vérifié MOXT' : 'Partenaire'}`,
          badge: org.rating ? `★ ${org.rating}` : 'Certifié',
          badgeColor: '#6366f1',
          path: `/organization/${org.id}`,
        }));

        return {
          text: `Voici **${data.length} changeur(s) et partenaires de change** référencés sur MOXT :`,
          results,
          suggestions: ['Nouveau transfert', 'Comparer les taux', 'Avis sur les changeurs'],
        };
      }
    } catch {
      // safe fallback
    }
  }

  // Réponse générale d'assistance
  return {
    text: "Je suis Moxti, votre assistant intelligent MOXT. Je peux rechercher pour vous dans toute la plateforme : annonces du Marketplace, vérification de doublons, état de vos transferts, offres d'emploi ou transport de colis. Que souhaitez-vous trouver ?",
    results: [],
    suggestions: [
      'Lister les articles qui ont le même nom',
      'Trouve mon dernier transfert effectué',
      'Liste les offres de jobs disponibles',
      'Chercher les colis et voyages',
    ],
  };
}
