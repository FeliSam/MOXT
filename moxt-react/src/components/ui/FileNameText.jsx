import { shortenFileName } from '../../services/uploadProgress'

/**
 * Affiche un nom de fichier tronqué sans élargir le layout (title = nom complet).
 */
export function FileNameText({ name, className = '', maxLength = 32, as: Tag = 'span' }) {
  if (!name) return null
  const full = String(name)
  return (
    <Tag className={`min-w-0 max-w-full truncate ${className}`} title={full}>
      {shortenFileName(full, maxLength)}
    </Tag>
  )
}
