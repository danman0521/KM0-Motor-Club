import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EventForm } from './EventForm'

describe('EventForm', () => {
  it('exige título y fecha', async () => {
    const onSubmit = vi.fn()
    render(<EventForm submitLabel="Crear evento" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(screen.getByText('Escribe el título del evento.')).toBeInTheDocument()
    expect(screen.getByText('Elige la fecha y la hora.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía los datos con la fecha en formato ISO', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<EventForm submitLabel="Crear evento" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), 'Rodada al mirador')
    await userEvent.type(screen.getByLabelText('Lugar'), 'Mirador del cerro')
    await userEvent.type(screen.getByLabelText('Fecha y hora'), '2027-01-15T07:30')
    await userEvent.type(screen.getByLabelText('Punto de encuentro'), 'Bomba de la 80')
    await userEvent.type(screen.getByLabelText('Enlace de mapa (opcional)'), 'maps.google.com/?q=x')
    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Rodada al mirador',
      description: '',
      location: 'Mirador del cerro',
      starts_at: new Date(2027, 0, 15, 7, 30).toISOString(),
      chronicle: null,
      meeting_point: 'Bomba de la 80',
      map_url: 'https://maps.google.com/?q=x',
    })
  })

  it('rechaza un enlace de mapa inválido', async () => {
    const onSubmit = vi.fn()
    render(<EventForm submitLabel="Crear evento" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), 'Rodada')
    await userEvent.type(screen.getByLabelText('Fecha y hora'), '2027-01-15T07:30')
    await userEvent.type(screen.getByLabelText('Enlace de mapa (opcional)'), 'javascript:alert(1)')
    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(screen.getByText('Ese enlace no es válido.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('precarga los valores iniciales (por ejemplo, desde una sugerencia)', () => {
    render(
      <EventForm
        submitLabel="Aprobar y crear evento"
        initial={{ title: 'Asado de fin de año', description: 'Propuesta de la comunidad', starts_at: new Date(2026, 11, 20, 12, 0).toISOString() }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Título')).toHaveValue('Asado de fin de año')
    expect(screen.getByLabelText('Descripción')).toHaveValue('Propuesta de la comunidad')
    expect(screen.getByLabelText('Fecha y hora')).toHaveValue('2026-12-20T12:00')
  })

  it('oculta la crónica si se indica', () => {
    render(<EventForm submitLabel="Crear evento" showChronicle={false} onSubmit={vi.fn()} />)
    expect(screen.queryByLabelText('Crónica')).not.toBeInTheDocument()
  })

  it('si falla el guardado muestra el error y conserva lo escrito', async () => {
    const onSubmit = vi.fn().mockRejectedValue({ code: '42501', message: 'permission denied' })
    render(<EventForm submitLabel="Crear evento" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), 'Rodada')
    await userEvent.type(screen.getByLabelText('Fecha y hora'), '2027-01-15T07:30')
    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso')
    expect(screen.getByLabelText('Título')).toHaveValue('Rodada')
  })
})
