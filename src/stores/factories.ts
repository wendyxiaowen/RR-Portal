import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '../pb'
import type { Factory } from '../types/factory'
import type { Craft } from '../constants/roles'

export function filterByCraft(list: Factory[], craft: Craft | null): Factory[] {
  if (!craft) return list
  return list.filter((f) => f.craft === craft)
}

export const useFactoriesStore = defineStore('factories', () => {
  const items = ref<Factory[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await pb.collection('factories').getFullList<Factory>({ sort: 'name' })
    } finally {
      loading.value = false
    }
  }
  async function get(id: string) {
    return pb.collection('factories').getOne<Factory>(id)
  }
  async function create(data: Partial<Factory>) {
    return pb.collection('factories').create<Factory>(data)
  }
  async function update(id: string, data: Partial<Factory>) {
    return pb.collection('factories').update<Factory>(id, data)
  }
  return { items, loading, fetchAll, get, create, update }
})
