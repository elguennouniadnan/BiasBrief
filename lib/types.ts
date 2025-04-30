export interface Article {
  id: number
  category: string
  titleUnbiased: string
  titleBiased: string
  content: string
  snippet: string
  date: string
  imageUrl?: string
  source: string // Added source field
}
