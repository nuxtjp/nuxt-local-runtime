import type {
  BoundaryTarget,
  InformationBand
} from './types'

const boundaryByBand: Record<InformationBand, BoundaryTarget> = {
  sealed: 'none',
  local: 'local-mesh',
  session: 'loopback-browser',
  control: 'external-control',
  public: 'public-network'
}

/**
 * Information may cross only the boundary named by its reviewed band.
 * Transforming or declassifying a record is a separate host responsibility.
 */
export function bandAllowsTarget(
  band: InformationBand,
  target: BoundaryTarget
): boolean {
  return boundaryByBand[band] === target
}

export function isBrowserVisibleBand(
  band: InformationBand
): band is 'session' | 'public' {
  return band === 'session' || band === 'public'
}
