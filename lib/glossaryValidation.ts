export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function validateHttpsSource(
  value: string,
  invalidUrlMessage = 'Chaque source doit etre une URL HTTPS valide.',
) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()

    if (url.protocol !== 'https:') return 'Les sources doivent utiliser HTTPS.'
    if (hostname === 'localhost' || hostname.endsWith('.local')) {
      return 'Les liens locaux ne sont pas autorises.'
    }
    if (/^(127|10)\./.test(hostname)) return 'Les adresses privees ne sont pas autorisees.'
    if (/^192\.168\./.test(hostname)) return 'Les adresses privees ne sont pas autorisees.'
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) {
      return 'Les adresses privees ne sont pas autorisees.'
    }
    if (hostname === '0.0.0.0' || hostname === '[::1]' || hostname === '::1') {
      return 'Les adresses locales ne sont pas autorisees.'
    }
    if (value.length > 2048) return 'Cette URL est trop longue.'

    return ''
  } catch {
    return invalidUrlMessage
  }
}
