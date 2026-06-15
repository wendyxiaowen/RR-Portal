import type { Role, Craft } from '../constants/roles'
import { BUYER_CRAFT } from '../constants/roles'

export function canEditOutput(role: Role): boolean {
  return role === 'finance_cost' || role === 'admin'
}
export function canApproveStatus(role: Role): boolean {
  return role === 'sc_manager' || role === 'admin'
}
export function canApproveScore(role: Role): boolean {
  return role === 'sc_manager' || role === 'admin'
}
export function canEditTemplates(role: Role): boolean {
  return role === 'admin'
}
// 返回该角色只能看的工艺；null = 看全部
export function visibleCraft(role: Role): Craft | null {
  return BUYER_CRAFT[role] ?? null
}
