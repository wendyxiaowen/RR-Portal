import type { Craft } from '../constants/roles'
export type FactoryStatus = 'active' | 'limited' | 'suspended' | 'eliminated'
export interface Factory {
  id: string
  name: string
  craft: Craft
  contact_person?: string
  contact_phone?: string
  address?: string
  workshop_area?: number
  equipment_list?: string[]
  qualification_files?: string[]
  qualification_expiry?: string
  status: FactoryStatus
  status_pending?: FactoryStatus | ''
  status_updated_by?: string
  status_updated_at?: string
  created_by?: string
}
