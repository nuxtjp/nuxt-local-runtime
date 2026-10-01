import { describe, expect, it } from 'vitest'
import Ajv2020 from 'ajv/dist/2020'
import schema from '../schemas/local-runtime-v1.schema.json'
import { grant, manifest, view } from './fixtures'

describe('published local runtime schema', () => {
  const validate = new Ajv2020({ strict: true }).compile(schema)

  it('accepts the runtime boundary documents', () => {
    const sessionRequest = {
      schema: 'nuxtjp://local-runtime/session-request/v1',
      origin: 'https://nerp.jp',
      audience: 'https://nerp.jp',
      client_nonce: 'session-nonce',
      requested_capabilities: ['workflow.issue.read']
    }
    const viewRequest = {
      schema: 'nuxtjp://local-runtime/view-request/v1',
      capability_id: 'workflow.issue.read',
      view_id: 'issue-summary',
      request_nonce: 'request-nonce'
    }
    for (const document of [
      manifest, sessionRequest, grant, viewRequest, view
    ]) {
      expect(validate(document), JSON.stringify(validate.errors)).toBe(true)
    }
  })

  it('rejects external action and unknown fields', () => {
    expect(validate({ ...manifest, external_actions: true })).toBe(false)
    expect(validate({ ...view, raw_local_path: '/private/data' })).toBe(false)
  })
})
