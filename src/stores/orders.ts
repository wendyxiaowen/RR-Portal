import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '../pb'
import type { Order } from '../types/order'

export const useOrdersStore = defineStore('orders', () => {
  const items = ref<Order[]>([])

  async function fetchAll(status?: string) {
    const filter = status ? `status = "${status}"` : ''
    items.value = await pb.collection('orders').getFullList<Order>({
      filter,
      expand: 'factory',
      sort: '-order_date',
    })
  }
  async function create(data: Partial<Order>) {
    return pb.collection('orders').create<Order>(data)
  }
  async function update(id: string, data: Partial<Order>) {
    return pb.collection('orders').update<Order>(id, data)
  }
  return { items, fetchAll, create, update }
})
