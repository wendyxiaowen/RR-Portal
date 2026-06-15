export type Role =
  | 'admin' | 'sc_manager'
  | 'buyer_injection' | 'buyer_painting' | 'buyer_assembly' | 'buyer_sewing'
  | 'finance_cost' | 'finance_mgr' | 'quality_qc' | 'sc_clerk'

export type Craft = 'injection' | 'painting' | 'assembly' | 'sewing'

export const ROLE_LABELS: Record<Role, string> = {
  admin: '管理员', sc_manager: '供应链经理',
  buyer_injection: '采购专员-注塑', buyer_painting: '采购专员-喷油',
  buyer_assembly: '采购专员-装配', buyer_sewing: '采购专员-毛绒车缝',
  finance_cost: '财务成本会计', finance_mgr: '财务主管',
  quality_qc: '品质QC', sc_clerk: '供应链文员',
}

export const CRAFT_LABELS: Record<Craft, string> = {
  injection: '注塑', painting: '喷油', assembly: '装配', sewing: '毛绒车缝',
}

// 采购角色 → 其负责的工艺
export const BUYER_CRAFT: Partial<Record<Role, Craft>> = {
  buyer_injection: 'injection', buyer_painting: 'painting',
  buyer_assembly: 'assembly', buyer_sewing: 'sewing',
}

export function isBuyer(role: Role): boolean {
  return role.startsWith('buyer_')
}
