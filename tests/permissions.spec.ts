import { describe, it, expect } from 'vitest'
import { canEditOutput, canApproveStatus, visibleCraft } from '../src/utils/permissions'

describe('permissions', () => {
  it('only finance_cost can edit output', () => {
    expect(canEditOutput('finance_cost')).toBe(true)
    expect(canEditOutput('buyer_injection')).toBe(false)
    expect(canEditOutput('admin')).toBe(true)
  })
  it('only sc_manager/admin approve status', () => {
    expect(canApproveStatus('sc_manager')).toBe(true)
    expect(canApproveStatus('buyer_injection')).toBe(false)
  })
  it('buyer sees only own craft, others see all', () => {
    expect(visibleCraft('buyer_painting')).toBe('painting')
    expect(visibleCraft('sc_manager')).toBeNull()
  })
})
