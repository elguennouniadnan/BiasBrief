export interface Article {
  id: number
  category: string
  section: string
  titleUnbiased: string
  titleBiased: string
  snippet: string
  body: string
  date: string
  imageUrl?: string
  source: string
  webUrl: string
}
