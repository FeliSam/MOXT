import { useEffect, useState } from 'react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { PostComposerForm } from '../components/ui/PostComposerForm'
import { useLanguage } from '../contexts/useLanguage'
import { getPostImages, MAX_POST_IMAGES, normalizePostImages } from '../features/posts/postMediaUtils'
import { updatePost } from '../features/posts/postsSlice'
import { addToast } from '../features/ui/uiSlice'
import { phase3Text } from '../i18n/phase3I18n'
import { storageService } from '../services/storageService'
import { useUploadProgress } from '../hooks/useUploadProgress'

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
  /** @type {Array<{ preview: string, file: File|null, remoteUrl: string|null }>} */
  const [imageItems, setImageItems] = useState([])
  const [initializedFor, setInitializedFor] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()

  useEffect(() => {
    if (!post || initializedFor === post.id) return
    setMessage(resolvePostMessage(post))
    setImageItems(
      getPostImages(post).map((url) => ({
        preview: url,
        file: null,
        remoteUrl: url,
      })),
    )
    setInitializedFor(post.id)
  }, [post, initializedFor])

  if (!post) return <Card>{p3('news.edit.notFound')}</Card>
  if (!user || post.authorId !== user.id) return <Navigate to="/news" replace />

  function handleAddFiles(files) {
    const remaining = MAX_POST_IMAGES - imageItems.length
    if (remaining <= 0) return
    Array.from(files || [])
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          setImageItems((current) => {
            if (current.length >= MAX_POST_IMAGES) return current
            return [...current, { preview: ev.target.result, file, remoteUrl: null }]
          })
        }
        reader.readAsDataURL(file)
      })
  }

  function removeImageAt(index) {
    setImageItems((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!message.trim() || submitting) return
    setSubmitting(true)
    try {
      const filesToUpload = imageItems.map((item) => item.file).filter(Boolean)
      let uploaded = []
      if (filesToUpload.length) {
        uploaded = await trackUpload((onProgress) =>
          storageService.uploadPostImages(user.id, postId, filesToUpload, {
            version: Date.now().toString(36),
            onProgress,
          }),
        )
      }
      let uploadIndex = 0
      const urls = imageItems
        .map((item) => {
          if (item.file) {
            const url = uploaded[uploadIndex]
            uploadIndex += 1
            return url
          }
          return item.remoteUrl || null
        })
        .filter(Boolean)

      const media = normalizePostImages(urls)
      dispatch(
        updatePost({
          id: postId,
          message: message.trim(),
          ...media,
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
            <Button variant="secondary" icon={FiArrowLeft}>
              {p3('common.cancel')}
            </Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-lg">
        <PostComposerForm
          user={user}
          message={message}
          onMessageChange={setMessage}
          imagePreviews={imageItems.map((item) => item.preview)}
          onAddFiles={handleAddFiles}
          onRemoveImageAt={removeImageAt}
          directLink={post.directLink || null}
          submitLabel={p3('news.edit.save')}
          submitIcon={FiSave}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/news')}
          submitting={submitting}
          progress={uploadProgress}
        />
      </Card>
    </div>
  )
}
