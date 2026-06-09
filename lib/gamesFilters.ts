export const tagFilters = ['RPG', 'Simulator', 'Adventure', 'Strategy', 'Indie', 'Tactical']

export const platformFilters = ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch']

export const releaseYearFilters = Array.from({ length: 37 }, (_, index) => String(2026 - index))

export const sortOptions = [
  { value: 'release_desc', label: 'Date de sortie - recentes' },
  { value: 'release_asc', label: 'Date de sortie - anciennes' },
  { value: 'name_asc', label: 'Ordre alphabetique - A-Z' },
  { value: 'name_desc', label: 'Ordre alphabetique - Z-A' },
]
