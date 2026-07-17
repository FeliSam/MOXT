import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { updatePost } from '../features/posts/postsSlice'
import { phase3Text } from '../i18n/phase3I18n'

export function EditPostPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const { postId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const post = useSelector((state) => state.posts?.items?.find((item) => item.id === postId))

  const [form, setForm] = useState(null)

  if (!post) return <Card>{p3('news.edit.notFound')}</Card>
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
        .map((tag) => tag.trim())
        .filter(Boolean),
    }))
    navigate('/news')
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('news.edit.eyebrow')}
        title={p3('news.edit.title')}
        description={p3('news.edit.description')}
        actions={
          <Link to="/news">
            <Button variant="secondary" icon={FiArrowLeft}>{p3('common.cancel')}</Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            label={p3('news.edit.titleLabel')}
            placeholder={p3('news.edit.titlePlaceholder')}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">{p3('news.edit.content')}</span>
            <textarea
              required
              className="min-h-40 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder={p3('news.edit.contentPlaceholder')}
              value={values.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </label>
          <Input
            label={p3('news.edit.image')}
            type="url"
            placeholder={p3('news.edit.imagePlaceholder')}
            value={values.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
          />
          <Input
            label={p3('news.edit.tags')}
            placeholder={p3('news.edit.tagsPlaceholder')}
            value={values.tags}
            onChange={(e) => set('tags', e.target.value)}
          />
          <Button type="submit" icon={FiSave}>{p3('news.edit.save')}</Button>
        </form>
      </Card>
    </div>
  )
}
