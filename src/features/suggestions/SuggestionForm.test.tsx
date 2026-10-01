import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SuggestionForm } from './SuggestionForm'

describe('SuggestionForm', () => {
  it('exige el título y no envía sin él', async () => {
    const onSubmit = vi.fn()
    render(<SuggestionForm onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Postular evento' }))

    expect(screen.getByText('Escribe un título para el evento.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía los datos recortados y limpia el formulario', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<SuggestionForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), '  Rodada al mirador  ')
    await userEvent.type(screen.getByLabelText('Descripción'), 'Salida de domingo')
    await userEvent.type(screen.getByLabelText('Fecha tentativa (opcional)'), '2027-01-15')
    await userEvent.click(screen.getByRole('button', { name: 'Postular evento' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Rodada al mirador',
      description: 'Salida de domingo',
      tentative_date: '2027-01-15',
    })
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByText('¡Sugerencia enviada! Los líderes la revisarán.')).toBeInTheDocument()
  })

  it('sin fecha envía null', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<SuggestionForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), 'Asado')
    await userEvent.click(screen.getByRole('button', { name: 'Postular evento' }))

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Asado', description: '', tentative_date: null })
  })

  it('si falla el envío muestra el error y conserva lo escrito', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    render(<SuggestionForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), 'Rodada nocturna')
    await userEvent.click(screen.getByRole('button', { name: 'Postular evento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar')
    expect(screen.getByLabelText('Título')).toHaveValue('Rodada nocturna')
  })
})
