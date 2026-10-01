import { Card, EmptyState, ErrorNote, PageTitle, Spinner } from '../components/ui'
import { SuggestionForm } from '../features/suggestions/SuggestionForm'
import { SuggestionList } from '../features/suggestions/SuggestionList'
import { useCreateSuggestion, useSuggestions } from '../features/suggestions/api'

export function SuggestionsPage() {
  const suggestions = useSuggestions()
  const create = useCreateSuggestion()

  return (
    <>
      <PageTitle>Sugerencias de la comunidad</PageTitle>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section>
          <h2 className="mb-3 text-2xl font-bold">Postula un evento</h2>
          <Card>
            <SuggestionForm onSubmit={(input) => create.mutateAsync(input)} />
          </Card>
          <p className="mt-2 text-sm text-muted">Los líderes deciden cuáles pasan al calendario.</p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold">Postuladas</h2>
          {suggestions.isPending && <Spinner />}
          {suggestions.isError && (
            <ErrorNote message="No se pudieron cargar las sugerencias." onRetry={() => suggestions.refetch()} />
          )}
          {suggestions.isSuccess && suggestions.data.length === 0 && <EmptyState>Sin sugerencias todavía.</EmptyState>}
          {suggestions.isSuccess && suggestions.data.length > 0 && <SuggestionList suggestions={suggestions.data} />}
        </section>
      </div>
    </>
  )
}
