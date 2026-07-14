import { describe, expect, it } from 'vitest'
import { buildDeliveryReport } from '../src/utils/deliveryStats'
import type { Order } from '../src/types/order'

function order(partial: Partial<Order>): Order {
  return {
    id: partial.id ?? 'id',
    factory: partial.factory ?? 'factory-id',
    product: partial.product ?? '产品',
    ...partial,
  }
}

describe('buildDeliveryReport', () => {
  it('counts the same order number as one order across multiple material rows', () => {
    const rows = buildDeliveryReport([
      order({
        id: 'row-1',
        order_no: 'FDYA-260140-2',
        product: '战斗猎犬头/鼻子',
        quantity: 3800,
        pmc: '陈梦楚',
        is_delayed: true,
        delay_days: 17,
      }),
      order({
        id: 'row-2',
        order_no: 'FDYA-260140-2',
        product: '战斗猎犬手掌/围裙',
        quantity: 3800,
        pmc: '陈梦楚',
        is_delayed: true,
        delay_days: 20,
      }),
    ], '东莞厂区 · 注塑部', () => '东莞鸿徽塑胶制品有限公司')

    expect(rows[0]).toMatchObject({
      kind: 'detail',
      orderCount: 1,
      delayedCount: 1,
      delayRatio: '100%',
      delayAvg: '20',
    })
    expect(rows[1]).toMatchObject({
      kind: 'detail',
      orderCount: 0,
      delayedCount: 0,
      delayRatio: '-',
      delayAvg: '-',
    })
    expect(rows[2]).toMatchObject({
      kind: 'subtotal',
      orderCount: 1,
      delayedCount: 1,
      delayRatio: '100%',
      delayAvg: '20',
    })
  })
})
