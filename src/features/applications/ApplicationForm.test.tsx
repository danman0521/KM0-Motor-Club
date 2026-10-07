import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationForm } from './ApplicationForm'

async function fillRequired() {
  await userEvent.type(screen.getByLabelText('¿Dónde vives?'), ' Medellín ')
  await userEvent.type(screen.getByLabelText('¿A qué te dedicas?'), 'Mecánico')
  await userEvent.type(screen.getByLabelText('Fecha de nacimiento'), '1990-05-20')
  await userEvent.selectOptions(screen.getByLabelText('Tipo de sangre (RH)'), 'O+')
  await userEvent.type(screen.getByLabelText('Nombre del contacto de emergencia'), 'Marta Díaz')
  await userEvent.type(screen.getByLabelText('Teléfono del contacto de emergencia'), '300 000 0000')
}

describe('ApplicationForm', () => {
  it('exige los datos básicos, el RH y el contacto de emergencia', async () => {
    const onSubmit = vi.fn()
    render(<ApplicationForm submitLabel="Enviar postulación" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    expect(screen.getByText('Dinos dónde vives.')).toBeInTheDocument()
    expect(screen.getByText('Dinos a qué te dedicas.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu fecha de nacimiento.')).toBeInTheDocument()
    expect(screen.getByText('Elige tu tipo de sangre.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el nombre de tu contacto de emergencia.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el teléfono de tu contacto de emergencia.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('si pertenece a otro grupo, pide cuál', async () => {
    const onSubmit = vi.fn()
    render(<ApplicationForm submitLabel="Enviar postulación" onSubmit={onSubmit} />)

    await fillRequired()
    await userEvent.click(screen.getByLabelText('Pertenezco a otro grupo motero'))
    await userEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    expect(screen.getByText('Dinos a cuál grupo perteneces.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía los datos recortados, sin fotos si no se eligieron', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ApplicationForm submitLabel="Enviar postulación" onSubmit={onSubmit} />)

    await fillRequired()
    await userEvent.type(screen.getByLabelText('Alergias'), 'Penicilina')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    expect(onSubmit).toHaveBeenCalledWith({
      input: {
        city: 'Medellín',
        occupation: 'Mecánico',
        birth_date: '1990-05-20',
        phone: '',
        other_club: '',
        blood_type: 'O+',
        allergies: 'Penicilina',
        medical_conditions: '',
        emergency_contact_name: 'Marta Díaz',
        emergency_contact_phone: '300 000 0000',
      },
      riderPhoto: null,
      motoPhoto: null,
    })
  })

  it('rechaza una fecha de nacimiento de menos de 16 años', async () => {
    const onSubmit = vi.fn()
    render(<ApplicationForm submitLabel="Enviar postulación" onSubmit={onSubmit} />)

    await fillRequired()
    const thisYear = new Date().getFullYear()
    await userEvent.clear(screen.getByLabelText('Fecha de nacimiento'))
    await userEvent.type(screen.getByLabelText('Fecha de nacimiento'), `${thisYear - 10}-01-01`)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    expect(screen.getByText('Revisa la fecha: hay que tener al menos 16 años.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('precarga una ficha existente', () => {
    render(
      <ApplicationForm
        submitLabel="Guardar cambios"
        initial={{ city: 'Envigado', occupation: 'Diseñadora', other_club: 'Los Buitres', blood_type: 'AB-' }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('¿Dónde vives?')).toHaveValue('Envigado')
    expect(screen.getByLabelText('Pertenezco a otro grupo motero')).toBeChecked()
    expect(screen.getByLabelText('¿Cuál?')).toHaveValue('Los Buitres')
    expect(screen.getByLabelText('Tipo de sangre (RH)')).toHaveValue('AB-')
  })
})
