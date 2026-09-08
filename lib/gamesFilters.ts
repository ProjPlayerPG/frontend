export const tagFilters = ['RPG', 'Simulator', 'Adventure', 'Strategy', 'Indie', 'Tactical']

export const platformFilters = ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch']

export const releaseYearFilters = Array.from({ length: 37 }, (_, index) => String(2026 - index))

export const contentFilters = [
  { value: '', label: 'Tous les contenus' },
  { value: 'community', label: 'Contenus communautaires' },
]

export const sortOptions = [
  { value: 'quality', label: 'Sélection PlayerPG' },
  { value: 'release_desc', label: 'Date de sortie - récentes' },
  { value: 'release_asc', label: 'Date de sortie - anciennes' },
  { value: 'name_asc', label: 'Ordre alphabétique - A-Z' },
  { value: 'name_desc', label: 'Ordre alphabétique - Z-A' },
]
