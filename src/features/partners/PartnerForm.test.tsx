import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PartnerForm } from './PartnerForm'

describe('PartnerForm', () => {
  it('exige nombre y beneficio', async () => {
    const onSubmit = vi.fn()
    render(<PartnerForm submitLabel="Crear convenio" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Crear convenio' }))

    expect(screen.getByText('Escribe el nombre de la empresa.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el beneficio para los miembros.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rechaza un sitio web inválido', async () => {
    const onSubmit = vi.fn()
    render(<PartnerForm submitLabel="Crear convenio" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Empresa'), 'Taller El Lobo')
    await userEvent.type(screen.getByLabelText('Beneficio'), '10 % en repuestos')
    await userEvent.type(screen.getByLabelText('Sitio web'), 'javascript:alert(1)')
    await userEvent.click(screen.getByRole('button', { name: 'Crear convenio' }))

    expect(screen.getByText('Ese enlace no es válido.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía los datos, completando https:// en el sitio web', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PartnerForm submitLabel="Crear convenio" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Empresa'), ' Taller El Lobo ')
    await userEvent.type(screen.getByLabelText('Categoría'), 'Talleres')
    await userEvent.type(screen.getByLabelText('Beneficio'), '10 % en repuestos')
    await userEvent.type(screen.getByLabelText('Sitio web'), 'tallerlobo.co')
    await userEvent.type(screen.getByLabelText('Vigente hasta (opcional)'), '2027-06-30')
    await userEvent.click(screen.getByRole('button', { name: 'Crear convenio' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Taller El Lobo',
      category: 'Talleres',
      benefit: '10 % en repuestos',
      description: '',
      phone: '',
      address: '',
      website: 'https://tallerlobo.co/',
      valid_until: '2027-06-30',
      active: true,
      logo: null,
    })
  })

  it('precarga un convenio existente', () => {
    render(
      <PartnerForm
        submitLabel="Guardar cambios"
        initial={{ name: 'Llantas Ruta', benefit: '2x1 en montaje', phone: '300 123 4567', website: null, active: false }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Empresa')).toHaveValue('Llantas Ruta')
    expect(screen.getByLabelText('Teléfono')).toHaveValue('300 123 4567')
    expect(screen.getByLabelText('Sitio web')).toHaveValue('')
    expect(screen.getByLabelText('Visible para los miembros')).not.toBeChecked()
  })
})
