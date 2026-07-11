import { Link } from 'react-router-dom'
import { HiQrCode } from 'react-icons/hi2'
import { FiShare2 } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'

export function ReferralShareButton({ className = '', compact = false }) {
  if (compact) {
    return (
      <Link to="/referral" className={className}>
        <Button variant="secondary" icon={HiQrCode} className="w-full sm:w-auto">
          Partager
        </Button>
      </Link>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Link to="/referral">
        <Button icon={HiQrCode}>QR code & invitation</Button>
      </Link>
      <Link to="/referral?tab=profile">
        <Button variant="ghost" icon={FiShare2}>
          Mon profil public
        </Button>
      </Link>
    </div>
  )
}
