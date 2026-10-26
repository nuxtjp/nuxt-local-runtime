use crate::{Error, Result, path};
use std::collections::HashSet;
use vite_manifest::Manifest;

pub struct AssetPlan {
    module: String,
    styles: Vec<String>,
    preloads: Vec<String>,
}
impl AssetPlan {
    pub(crate) fn new(manifest: &Manifest, name: &str) -> Result<Self> {
        let root = manifest.manifest().get(name).ok_or(Error::MissingEntry)?;
        if root.is_entry != Some(true) {
            return Err(Error::MissingEntry);
        }
        if ![".js", ".mjs"]
            .iter()
            .any(|suffix| root.file.ends_with(suffix))
        {
            return Err(Error::Unsupported);
        }
        let imported = manifest.imported_chunks(name);
        let mut styles = Vec::new();
        let mut preloads = Vec::new();
        let mut seen = HashSet::new();
        for chunk in std::iter::once(root).chain(imported.iter()) {
            for file in chunk.css.iter().flatten() {
                if seen.insert(file.as_str()) {
                    styles.push(path::url(file));
                }
            }
        }
        let mut seen = HashSet::new();
        for chunk in &imported {
            if chunk.file == root.file || !seen.insert(chunk.file.as_str()) {
                continue;
            }
            if ![".js", ".mjs"]
                .iter()
                .any(|suffix| chunk.file.ends_with(suffix))
            {
                return Err(Error::Unsupported);
            }
            preloads.push(path::url(&chunk.file));
        }
        Ok(Self {
            module: path::url(&root.file),
            styles,
            preloads,
        })
    }
    pub fn module_url(&self) -> &str {
        &self.module
    }
    pub fn styles(&self) -> &[String] {
        &self.styles
    }
    pub fn preloads(&self) -> &[String] {
        &self.preloads
    }
    pub fn tags(&self) -> String {
        let mut tags = String::new();
        for file in &self.styles {
            tags.push_str(&format!("<link rel=\"stylesheet\" href=\"{file}\">\n"));
        }
        tags.push_str(&format!(
            "<script type=\"module\" src=\"{}\"></script>",
            self.module
        ));
        for file in &self.preloads {
            tags.push_str(&format!("\n<link rel=\"modulepreload\" href=\"{file}\">"));
        }
        tags
    }
}
