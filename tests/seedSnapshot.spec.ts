import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migrationPath = resolve(import.meta.dirname, '../pb_migrations/1784190320_seed_existing_snapshot.js')

function snapshotFromMigration() {
  const source = readFileSync(migrationPath, 'utf8')
  const start = source.indexOf('const SNAPSHOT = ') + 'const SNAPSHOT = '.length
  const end = source.indexOf('\n\nfunction filterValue', start)
  return { source, snapshot: JSON.parse(source.slice(start, end)) }
}

describe('sanitized seed snapshot', () => {
  it('contains the approved records without authentication secrets', () => {
    const { source, snapshot } = snapshotFromMigration()

    expect(source).not.toMatch(/"(?:password|tokenKey)"\s*:/)
    expect(snapshot.users).toHaveLength(19)
    expect(snapshot._superusers).toHaveLength(2)
    expect(snapshot.factories).toHaveLength(186)
    expect(snapshot.orders).toHaveLength(92)
    expect(snapshot.quality_inspections).toHaveLength(479)
    expect(snapshot.quality_5s_checks).toHaveLength(1)
    expect(snapshot.score_templates).toHaveLength(10)
    expect(snapshot.monthly_scores).toHaveLength(1)
    expect(snapshot.review_meetings).toHaveLength(1)
    expect(snapshot.kpi_logs).toHaveLength(1)

    for (const record of [...snapshot.users, ...snapshot._superusers]) {
      expect(record).not.toHaveProperty('password')
      expect(record).not.toHaveProperty('tokenKey')
      expect(record).not.toHaveProperty('avatar')
    }
  })
})
