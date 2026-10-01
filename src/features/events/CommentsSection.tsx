import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { Avatar } from '../../components/Avatar'
import { EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { formatEventDate } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'
import { displayName } from '../../lib/supabase'
import { CommentForm } from './CommentForm'
import { useAddComment, useComments, useDeleteComment } from './community'

/** Comentarios de un evento realizado. El autor o un líder pueden borrarlos. */
export function CommentsSection({ eventId }: { eventId: string }) {
  const { profile, isLeader } = useAuth()
  const comments = useComments(eventId)
  const addComment = useAddComment(eventId)
  const deleteComment = useDeleteComment(eventId)
  const [error, setError] = useState('')

  async function remove(id: string) {
    if (!window.confirm('¿Borrar este comentario?')) return
    setError('')
    try {
      await deleteComment.mutateAsync(id)
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">Comentarios</h2>
      <div className="space-y-4">
        {comments.isPending && <Spinner label="Cargando comentarios…" />}
        {comments.isError && <ErrorNote message="No se pudieron cargar los comentarios." onRetry={() => comments.refetch()} />}
        {comments.isSuccess && comments.data.length === 0 && <EmptyState>Aún no hay comentarios. Sé el primero.</EmptyState>}
        {error && <ErrorNote message={error} />}

        {comments.isSuccess && comments.data.length > 0 && (
          <ul className="space-y-3">
            {comments.data.map((c) => (
              <li key={c.id} className="flex gap-3 rounded-lg border border-surface-2 bg-surface p-3">
                <Avatar profile={c.author} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold">{displayName(c.author)}</p>
                    <p className="text-xs text-muted first-letter:uppercase">{formatEventDate(c.created_at)}</p>
                  </div>
                  <p className="whitespace-pre-line break-words text-steel">{c.body}</p>
                  {(isLeader || c.author_id === profile?.id) && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      disabled={deleteComment.isPending}
                      className="mt-1 text-xs font-semibold text-red-hover hover:underline disabled:opacity-50"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <CommentForm onSubmit={(body) => addComment.mutateAsync(body)} />
      </div>
    </section>
  )
}
