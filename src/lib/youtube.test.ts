import { describe, expect, it } from 'vitest'
import { parseYouTubeId, youTubeEmbedUrl } from './youtube'

describe('parseYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc123', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/a1B2c3D4e5F', 'a1B2c3D4e5F'],
    ['https://www.youtube.com/embed/a1B2c3D4e5F', 'a1B2c3D4e5F'],
    ['https://www.youtube.com/live/a1B2c3D4e5F?feature=share', 'a1B2c3D4e5F'],
    ['https://www.youtube-nocookie.com/embed/a1B2c3D4e5F', 'a1B2c3D4e5F'],
    ['youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  https://youtu.be/dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/_-_-_-_-_-_', '_-_-_-_-_-_'],
  ])('acepta %s', (input, id) => {
    expect(parseYouTubeId(input)).toBe(id)
  })

  it.each([
    [''],
    ['hola'],
    ['https://vimeo.com/123456789'],
    ['https://www.youtube.com/'],
    ['https://www.youtube.com/watch?v=corto'],
    ['https://www.youtube.com/watch?v=demasiado-largo-para-ser-id'],
    ['https://youtu.be/'],
    ['https://youtube.com.malicioso.com/watch?v=dQw4w9WgXcQ'],
    ['https://example.com/?u=https://youtu.be/dQw4w9WgXcQ'],
    ['javascript:alert(1)//youtu.be/dQw4w9WgXcQ'],
    ['https://www.youtube.com/playlist?list=PL1234567890'],
  ])('rechaza %s', (input) => {
    expect(parseYouTubeId(input)).toBeNull()
  })
})

describe('youTubeEmbedUrl', () => {
  it('usa el dominio sin cookies', () => {
    expect(youTubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
})
