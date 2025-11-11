export type Trip = {
  id: string
  userId?: string
  title: string
  destination: string
  startDate: string
  endDate: string
  days: Day[]
  budget: {
    currency: 'CNY' | 'JPY' | 'USD'
    totalEstimate: number
    breakdown: { category: string; estimate: number; note?: string }[]
  }
  preferences?: { people: number; tags: string[] }
  createdAt: string
  updatedAt: string
}

export type Day = {
  date: string
  items: Item[]
}

export type Item = {
  time?: string
  type: 'sight' | 'food' | 'hotel' | 'transport' | 'activity'
  title: string
  note?: string
  location?: { name?: string; address?: string; lat?: number; lng?: number }
  costEstimate?: number
}