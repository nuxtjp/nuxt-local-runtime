export type InformationBand =
  | 'sealed'
  | 'local'
  | 'session'
  | 'control'
  | 'public'

export type BoundaryTarget =
  | 'none'
  | 'local-mesh'
  | 'loopback-browser'
  | 'external-control'
  | 'public-network'

export interface RuntimeEngine {
  kind: 'rust-v8'
  status: 'disabled' | 'simulated' | 'ready'
  isolation: 'in-process-simulation' | 'process'
  arbitrary_network: false
  arbitrary_filesystem: false
}

export interface RuntimeLimits {
  max_request_bytes: number
  max_response_bytes: number
  max_messages_per_minute: number
  max_bytes_per_minute: number
  session_ttl_seconds: number
}

export interface RuntimeSecurity {
  default_band: 'sealed'
  external_egress: 'deny'
  allowed_origins: string[]
  limits: RuntimeLimits
}

export type PayloadValueKind = 'text' | 'count' | 'boolean'
export type PayloadScalar = string | number | boolean

export interface RuntimePayloadField {
  name: string
  kind: PayloadValueKind
}

export interface RuntimePayloadSchema {
  id: string
  fields: RuntimePayloadField[]
}

export interface RuntimeCapability {
  id: string
  service_id: string
  description: string
  output_band: 'session' | 'public'
  payload_schema: RuntimePayloadSchema
}

export interface LocalRuntimeManifest {
  schema: 'nuxtjp://local-runtime/manifest/v1'
  runtime_id: string
  protocol_version: '1'
  mode: 'local-simulation' | 'local-production'
  external_actions: false
  engine: RuntimeEngine
  security: RuntimeSecurity
  capabilities: RuntimeCapability[]
}

export interface SessionRequest {
  schema: 'nuxtjp://local-runtime/session-request/v1'
  origin: string
  audience: string
  client_nonce: string
  requested_capabilities: string[]
}

export interface SessionBudget {
  max_messages: number
  max_bytes: number
}

export interface SessionGrant {
  schema: 'nuxtjp://local-runtime/session-grant/v1'
  session_id: string
  token: string
  subject_id: string
  audience: string
  expires_at_unix_seconds: number
  granted_capabilities: string[]
  classification_ceiling: 'session'
  budget: SessionBudget
  external_actions: false
}

export interface ViewRequest {
  schema: 'nuxtjp://local-runtime/view-request/v1'
  capability_id: string
  view_id: string
  request_nonce: string
}

export interface ViewEnvelope {
  schema: 'nuxtjp://local-runtime/view/v1'
  capability_id: string
  view_id: string
  payload_schema_id: string
  band: 'session' | 'public'
  generated_at_unix_seconds: number
  expires_at_unix_seconds: number
  external_actions: false
  payload: Record<string, PayloadScalar>
}

export type ConnectionPhase =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'denied'
  | 'unavailable'

export interface LocalRuntimeState {
  phase: ConnectionPhase
  manifest: LocalRuntimeManifest | null
  error: string | null
}
