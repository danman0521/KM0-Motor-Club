import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MotorcycleForm } from './MotorcycleForm'

describe('MotorcycleForm', () => {
  it('exige marca y modelo', async () => {
    const onSubmit = vi.fn()
    render(<MotorcycleForm submitLabel="Añadir moto" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Añadir moto' }))

    expect(screen.getByText('Escribe la marca.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el modelo.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía los datos recortados; año y cilindraje como número o null', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<MotorcycleForm submitLabel="Añadir moto" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Marca'), '  Yamaha  ')
    await userEvent.type(screen.getByLabelText('Modelo'), 'MT-07')
    await userEvent.type(screen.getByLabelText('Año (opcional)'), '2022')
    await userEvent.type(screen.getByLabelText('Cilindraje en cc (opcional)'), '689')
    await userEvent.type(screen.getByLabelText('Color (opcional)'), 'Azul')
    await userEvent.type(screen.getByLabelText('Placa (opcional)'), 'ABC12D')
    await userEvent.click(screen.getByRole('button', { name: 'Añadir moto' }))

    expect(onSubmit).toHaveBeenCalledWith({
      brand: 'Yamaha',
      model: 'MT-07',
      year: 2022,
      displacement_cc: 689,
      color: 'Azul',
      plate: 'ABC12D',
      photo: null,
    })
  })

  it('sin año ni cilindraje envía null en esos campos', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<MotorcycleForm submitLabel="Añadir moto" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Marca'), 'Honda')
    await userEvent.type(screen.getByLabelText('Modelo'), 'CB500')
    await userEvent.click(screen.getByRole('button', { name: 'Añadir moto' }))

    expect(onSubmit).toHaveBeenCalledWith({
      brand: 'Honda',
      model: 'CB500',
      year: null,
      displacement_cc: null,
      color: '',
      plate: '',
      photo: null,
    })
  })

  it('precarga una moto existente', () => {
    render(
      <MotorcycleForm
        submitLabel="Guardar cambios"
        initial={{ brand: 'Suzuki', model: 'GN125', year: 2010, color: 'Rojo' }}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Marca')).toHaveValue('Suzuki')
    expect(screen.getByLabelText('Año (opcional)')).toHaveValue(2010)
    expect(screen.getByLabelText('Color (opcional)')).toHaveValue('Rojo')
  })
})
