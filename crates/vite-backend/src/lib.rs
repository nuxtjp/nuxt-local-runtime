//! Vite asset integration only: no HTTP server, process execution, JS or grants.
mod development;
mod manifest;
mod path;
mod plan;
mod validation;

pub use development::DevelopmentAssets;
pub use manifest::ProductionAssets;
pub use plan::AssetPlan;

pub const MAX_MANIFEST_BYTES: usize = 262_144;
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Error {
    Budget,
    InvalidManifest,
    InvalidPath,
    InvalidOrigin,
    MissingEntry,
    MissingImport,
    Unsupported,
}
pub type Result<T> = std::result::Result<T, Error>;
