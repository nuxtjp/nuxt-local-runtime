use crate::{AssetPlan, Error, MAX_MANIFEST_BYTES, Result, validation};
use std::io::Read;
use vite_manifest::{Manifest, parse_manifest};

pub struct ProductionAssets {
    pub(crate) manifest: Manifest,
}
impl ProductionAssets {
    /// Caller supplies a reviewed build-manifest stream; this library never
    /// opens arbitrary paths or performs network requests.
    pub fn read(mut reader: impl Read) -> Result<Self> {
        let mut bytes = Vec::new();
        reader
            .by_ref()
            .take((MAX_MANIFEST_BYTES + 1) as u64)
            .read_to_end(&mut bytes)
            .map_err(|_| Error::InvalidManifest)?;
        Self::parse(&bytes)
    }
    pub fn parse(bytes: &[u8]) -> Result<Self> {
        if bytes.len() > MAX_MANIFEST_BYTES {
            return Err(Error::Budget);
        }
        // Unknown interface fields require a reviewed adapter change, rather
        // than silently adopting unsupported Vite features such as import maps.
        let raw: serde_json::Value =
            serde_json::from_slice(bytes).map_err(|_| Error::InvalidManifest)?;
        let fields = [
            "src",
            "file",
            "css",
            "assets",
            "isEntry",
            "name",
            "names",
            "isDynamicEntry",
            "imports",
            "dynamicImports",
        ];
        for value in raw.as_object().ok_or(Error::InvalidManifest)?.values() {
            let row = value.as_object().ok_or(Error::InvalidManifest)?;
            if row.keys().any(|key| !fields.contains(&key.as_str())) {
                return Err(Error::Unsupported);
            }
        }
        drop(raw);
        let text = std::str::from_utf8(bytes).map_err(|_| Error::InvalidManifest)?;
        let manifest = parse_manifest(text).map_err(|_| Error::InvalidManifest)?;
        validation::validate(&manifest)?;
        Ok(Self { manifest })
    }
    pub fn entry(&self, name: &str) -> Result<AssetPlan> {
        AssetPlan::new(&self.manifest, name)
    }
    /// Raw output file names only. HTTP routing/decoding/filesystem containment
    /// remain the backend adapter's responsibility.
    pub fn files(&self) -> std::collections::BTreeSet<&str> {
        self.manifest
            .manifest()
            .values()
            .flat_map(|chunk| {
                std::iter::once(chunk.file.as_str())
                    .chain(chunk.css.iter().flatten().map(String::as_str))
                    .chain(chunk.assets.iter().flatten().map(String::as_str))
            })
            .collect()
    }
}
