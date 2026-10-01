import type {
  LocalRuntimeManifest,
  SessionGrant,
  ViewEnvelope
} from '../src/runtime/shared/types'

export const manifest: LocalRuntimeManifest = {
  schema: 'nuxtjp://local-runtime/manifest/v1',
  runtime_id: 'local-simulation',
  protocol_version: '1',
  mode: 'local-simulation',
  external_actions: false,
  engine: {
    kind: 'rust-v8',
    status: 'simulated',
    isolation: 'in-process-simulation',
    arbitrary_network: false,
    arbitrary_filesystem: false
  },
  security: {
    default_band: 'sealed',
    external_egress: 'deny',
    allowed_origins: ['https://nerp.jp'],
    limits: {
      max_request_bytes: 16384,
      max_response_bytes: 262144,
      max_messages_per_minute: 60,
      max_bytes_per_minute: 1048576,
      session_ttl_seconds: 300
    }
  },
  capabilities: [{
    id: 'workflow.issue.read',
    service_id: 'constillo',
    description: '課題の要約を読み取る',
    output_band: 'session',
    payload_schema: {
      id: 'nuxtjp.workflow-issue-summary.v1',
      fields: [{ name: 'count', kind: 'count' }]
    }
  }]
}

export const grant: SessionGrant = {
  schema: 'nuxtjp://local-runtime/session-grant/v1',
  session_id: 'session-1',
  token: 'token-1',
  subject_id: 'device-local',
  audience: 'https://nerp.jp',
  expires_at_unix_seconds: Math.floor(Date.now() / 1000) + 300,
  granted_capabilities: ['workflow.issue.read'],
  classification_ceiling: 'session',
  budget: { max_messages: 60, max_bytes: 1048576 },
  external_actions: false
}

export const view: ViewEnvelope = {
  schema: 'nuxtjp://local-runtime/view/v1',
  capability_id: 'workflow.issue.read',
  view_id: 'issue-summary',
  payload_schema_id: 'nuxtjp.workflow-issue-summary.v1',
  band: 'session',
  generated_at_unix_seconds: 1,
  expires_at_unix_seconds: 60,
  external_actions: false,
  payload: { count: 2 }
}
