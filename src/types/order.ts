export type OrderStatus = 'placed' | 'producing' | 'delivered' | 'cancelled' | 'returned'
export interface Order {
  id: string
  factory: string
  process?: string
  item_no?: string
  product: string
  quantity?: number
  unit_price?: number
  amount?: number
  defect_rate?: number
  order_date?: string
  delivery_date?: string
  status?: OrderStatus
  notes?: string
  created_by?: string
  expand?: { factory?: { name: string; craft: string } }
}
