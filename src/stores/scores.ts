import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '../pb'
import type { MonthlyScore } from '../types/score'

export const useScoresStore = defineStore('scores', () => {
  const items = ref<MonthlyScore[]>([])

  async function fetchByMonth(yearMonth: string) {
    items.value = await pb.collection('monthly_scores').getFullList<MonthlyScore>({
      filter: `year_month = "${yearMonth}"`,
      expand: 'factory',
    })
  }
  async function getOne(factoryId: string, yearMonth: string): Promise<MonthlyScore | null> {
    const r = await pb.collection('monthly_scores').getFullList<MonthlyScore>({
      filter: `factory = "${factoryId}" && year_month = "${yearMonth}"`,
    })
    return r[0] ?? null
  }
  async function save(factoryId: string, yearMonth: string, data: Partial<MonthlyScore>) {
    const existing = await getOne(factoryId, yearMonth)
    if (existing) return pb.collection('monthly_scores').update(existing.id, data)
    return pb.collection('monthly_scores').create({
      factory: factoryId, year_month: yearMonth, status: 'draft', flag: 'none', ...data,
    })
  }
  return { items, fetchByMonth, getOne, save }
})
