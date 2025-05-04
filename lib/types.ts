export interface Article {
  id: number
  category: string // This will store pillarName
  section: string // This will store sectionName
  titleUnbiased: string
  titleBiased: string
  content: string
  snippet: string
  date: string
  imageUrl?: string
  source: string
  body?: string
  webUrl: string
}
