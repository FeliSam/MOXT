import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { updatePost } from '../features/posts/postsSlice'

export function EditPostPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { postId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const post = useSelector((state) => state.posts?.items?.find((item) => item.id === postId))

  const [form, setForm] = useState(null)

  if (!post) return <Card>Publication introuvable.</Card>
  if (post.authorId !== user.id) return <Navigate to="/news" replace />

  const values = form ?? {
    title: post.title || '',
    body: post.body || post.content || '',
    imageUrl: post.imageUrl || '',
    tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
  }

  function set(field, value) {
    setForm((prev) => ({ ...(prev ?? values), [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    dispatch(updatePost({
      id: postId,
      title: values.title,
      body: values.body,
      content: values.body,
      imageUrl: values.imageUrl,
      tags: values.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }))
    navigate('/news')
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Actualités"
        title="Modifier la publication"
        description="Mettez à jour votre post dans le fil d'actualité."
        actions={
          <Link to="/news">
            <Button variant="secondary" icon={FiArrowLeft}>Annuler</Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Titre (optionnel)"
            placeholder="Donnez un titre accrocheur…"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Contenu</span>
            <textarea
              required
              className="min-h-40 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder="Partagez une info, une annonce, une actualité…"
              value={values.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </label>
          <Input
            label="Image (URL, optionnel)"
            type="url"
            placeholder="https://…"
            value={values.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
          />
          <Input
            label="Tags (séparés par des virgules)"
            placeholder="Ex : événement, moscou, culture"
            value={values.tags}
            onChange={(e) => set('tags', e.target.value)}
          />
          <Button type="submit" icon={FiSave}>Enregistrer les modifications</Button>
        </form>
      </Card>
    </div>
  )
}
