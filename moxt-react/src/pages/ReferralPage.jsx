import { useMemo, useState } from 'react'
import { FiCheck, FiCopy, FiGift, FiShare2, FiUsers } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

/** Génère un code d'invitation stable à partir de l'identifiant utilisateur. */
function buildReferralCode(user) {
  const base = (user?.id || user?.email || 'MOXT').toString()
  let hash = 0
  for (let index = 0; index < base.length; index += 1) {
    hash = (hash * 31 + base.charCodeAt(index)) >>> 0
  }
  const suffix = hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
  return `MOXT-${suffix}`
}

const STEPS = [
  {
    icon: FiShare2,
    title: 'Partagez votre lien',
    description: 'Envoyez votre code ou votre lien à vos proches en Afrique comme en Russie.',
  },
  {
    icon: FiUsers,
    title: 'Ils rejoignent MOXT',
    description: 'Vos invités créent leur compte en quelques minutes.',
  },
  {
    icon: FiGift,
    title: 'Ils profitent de MOXT',
    description: 'Transferts, colis, marketplace, jobs et événements, réunis au même endroit.',
  },
]

export function ReferralPage() {
  const user = useSelector((state) => state.auth.user)
  const referralCode = useMemo(() => buildReferralCode(user), [user])
  const referralLink = `https://moxt.app/invite/${referralCode}`
  const [copied, setCopied] = useState('')

  async function copyValue(value, key) {
    try {
      await navigator.clipboard?.writeText(value)
      setCopied(key)
      window.setTimeout(() => setCopied(''), 2000)
    } catch {
      setCopied('')
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoignez MOXT',
          text: 'Transferts, colis et services entre l’Afrique et la Russie. Rejoignez-moi sur MOXT :',
          url: referralLink,
        })
        return
      } catch {
        /* partage annulé — on retombe sur la copie */
      }
    }
    copyValue(referralLink, 'link')
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Communauté"
        title="Inviter un ami"
        description="Invitez vos proches à rejoindre MOXT."
      />

      <Card className="relative overflow-hidden border-0 bg-[linear-gradient(135deg,#0f766e_0%,#0b8975_45%,#2563eb_100%)] text-white">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/12">
            <FiGift className="text-2xl" />
          </span>
          <h2 className="font-display mt-4 text-2xl font-extrabold">Votre code d’invitation</h2>
          <p className="mt-1 max-w-md text-sm text-white/75">
            Partagez ce code avec vos proches pour qu’ils rejoignent MOXT.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="rounded-2xl bg-white/12 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                Code
              </span>
              <strong className="mt-1 block text-2xl tracking-[0.12em]">{referralCode}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                className="border border-white/25 bg-white/10 text-white shadow-none hover:bg-white/20"
                icon={copied === 'code' ? FiCheck : FiCopy}
                onClick={() => copyValue(referralCode, 'code')}
              >
                {copied === 'code' ? 'Copié' : 'Copier'}
              </Button>
              <Button
                variant="secondary"
                className="!border-transparent !bg-white !text-slate-950 hover:!bg-slate-100"
                icon={FiShare2}
                onClick={shareLink}
              >
                Partager
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyValue(referralLink, 'link')}
            className="mt-3 flex w-full items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/15"
          >
            {copied === 'link' ? <FiCheck className="shrink-0" /> : <FiCopy className="shrink-0" />}
            <span className="truncate">{referralLink}</span>
          </button>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ description, icon: Icon, title }, index) => (
          <Card key={title}>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <Icon />
              </span>
              <Badge tone="neutral">Étape {index + 1}</Badge>
            </div>
            <h3 className="mt-4 font-black">{title}</h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>
          </Card>
        ))}
      </section>

      <Card>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <FiUsers />
          </span>
          <div>
            <h2 className="font-black">Mes invitations</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              Le suivi de vos invitations apparaîtra ici.
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-[var(--radius-card)] bg-[var(--app-surface-muted)] p-6 text-center">
          <p className="text-sm text-[var(--app-text-muted)]">
            Vous n’avez encore invité personne. Partagez votre code pour commencer.
          </p>
        </div>
      </Card>
    </div>
  )
}
