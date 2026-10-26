use crate::{Error, Result, path};
use std::collections::HashSet;
use vite_manifest::Manifest;

pub(crate) fn validate(manifest: &Manifest) -> Result<()> {
    let chunks = manifest.manifest();
    if chunks.is_empty() || chunks.len() > 256 {
        return Err(Error::Budget);
    }
    let mut files = HashSet::new();
    let mut refs = 0usize;
    for (key, chunk) in chunks {
        path::validate(key)?;
        path::validate(&chunk.file)?;
        if !files.insert(&chunk.file) {
            return Err(Error::InvalidManifest);
        }
        for items in [
            &chunk.css,
            &chunk.assets,
            &chunk.imports,
            &chunk.dynamic_imports,
        ]
        .into_iter()
        .flatten()
        {
            if items.len() > 64 {
                return Err(Error::Budget);
            }
            refs = refs.checked_add(items.len()).ok_or(Error::Budget)?;
            if refs > 2048 {
                return Err(Error::Budget);
            }
            for item in items {
                path::validate(item)?;
            }
        }
        for css in chunk.css.iter().flatten() {
            if !css.ends_with(".css") {
                return Err(Error::Unsupported);
            }
        }
        for import in chunk
            .imports
            .iter()
            .chain(chunk.dynamic_imports.iter())
            .flatten()
        {
            if !chunks.contains_key(import) {
                return Err(Error::MissingImport);
            }
        }
    }
    // Bound the third-party recursive traversal before invoking it. A visited
    // node ends a cycle; all static/dynamic references were checked above.
    for key in chunks.keys() {
        depth(manifest, key, 0, &mut HashSet::new())?;
    }
    Ok(())
}
fn depth<'a>(
    manifest: &'a Manifest,
    key: &'a str,
    level: usize,
    seen: &mut HashSet<&'a str>,
) -> Result<()> {
    if !seen.insert(key) {
        return Ok(());
    }
    if level > 16 {
        return Err(Error::Budget);
    }
    let chunk = manifest.manifest().get(key).ok_or(Error::MissingImport)?;
    for import in chunk.imports.iter().flatten() {
        depth(manifest, import, level + 1, seen)?;
    }
    Ok(())
}
