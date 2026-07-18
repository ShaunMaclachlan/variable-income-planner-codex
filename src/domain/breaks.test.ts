import { describe, expect, it } from 'vitest'
import { statutoryBreakMinutes } from './breaks'

describe('adult legal-minimum break assumption', () => {
  it('does not add a break for a shift of exactly six hours', () => {
    expect(statutoryBreakMinutes(6)).toBe(0)
  })

  it('adds 20 minutes when a shift is longer than six hours', () => {
    expect(statutoryBreakMinutes(6.01)).toBe(20)
  })
})
