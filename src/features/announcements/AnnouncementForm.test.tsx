import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AnnouncementForm } from './AnnouncementForm'

describe('AnnouncementForm', () => {
  it('exige título y contenido', async () => {
    const onSubmit = vi.fn()
    render(<AnnouncementForm submitLabel="Publicar" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(screen.getByText('Escribe el título.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el contenido.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía con la casilla de fijar marcada', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<AnnouncementForm submitLabel="Publicar" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), '  Reunión mensual  ')
    await userEvent.type(screen.getByLabelText('Contenido'), 'El viernes a las 7.')
    await userEvent.click(screen.getByLabelText('Fijar arriba'))
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Reunión mensual', body: 'El viernes a las 7.', pinned: true })
  })

  it('si falla muestra el error y conserva lo escrito', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    render(<AnnouncementForm submitLabel="Publicar" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), 'Aviso')
    await userEvent.type(screen.getByLabelText('Contenido'), 'Texto')
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar')
    expect(screen.getByLabelText('Título')).toHaveValue('Aviso')
  })
})
