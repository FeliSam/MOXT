import { useEffect, useState } from 'react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { PostComposerForm } from '../components/ui/PostComposerForm'
import { useLanguage } from '../contexts/useLanguage'
import { updatePost } from '../features/posts/postsSlice'
import { addToast } from '../features/ui/uiSlice'
import { phase3Text } from '../i18n/phase3I18n'
import { storageService } from '../services/storageService'

function resolvePostMessage(post) {
  if (!post) return ''
  return post.message || post.body || post.content || ''
}

export function EditPostPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const { postId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const post = useSelector((state) => state.posts?.items?.find((item) => item.id === postId))

  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [initializedFor, setInitializedFor] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!post || initializedFor === post.id) return
    setMessage(resolvePostMessage(post))
    setImagePreview(post.imageUrl || '')
    setImageFile(null)
    setInitializedFor(post.id)
  }, [post, initializedFor])

  if (!post) return <Card>{p3('news.edit.notFound')}</Card>
  if (!user || post.authorId !== user.id) return <Navigate to="/news" replace />

  function handleSelectFile(file) {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview('')
  }

  async function handleSubmit() {
    if (!message.trim() || submitting) return
    setSubmitting(true)
    try {
      let imageUrl = imagePreview || null
      if (imageFile) {
        imageUrl = await storageService.uploadPostImage(user.id, imageFile)
      }
      dispatch(
        updatePost({
          id: postId,
          message: message.trim(),
          imageUrl,
        }),
      )
      dispatch(
        addToast({
          title: p3('news.edit.savedTitle'),
          message: p3('news.edit.savedMessage'),
          tone: 'success',
        }),
      )
      navigate('/news')
    } catch (err) {
      dispatch(
        addToast({
          title: p3('common.error'),
          message: err?.message || p3('common.retryLater'),
          tone: 'error',
        }),
      )
    } finally {
      setSubmitting(false)
    }
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
      <Card className="mx-auto w-full max-w-lg">
        <PostComposerForm
          user={user}
          message={message}
          onMessageChange={setMessage}
          imagePreview={imagePreview}
          onSelectFile={handleSelectFile}
          onRemoveImage={removeImage}
          directLink={post.directLink || null}
          submitLabel={p3('news.edit.save')}
          submitIcon={FiSave}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/news')}
          submitting={submitting}
        />
      </Card>
    </div>
  )
}
