use crate::{Error, Result, path};
use std::net::SocketAddr;

pub struct DevelopmentAssets {
    origin: String,
    entry: String,
}
impl DevelopmentAssets {
    /// Explicit canonical numeric-loopback HTTP origin. No availability probes,
    /// environment discovery, automatic production fallback or child process.
    pub fn new(origin: &str, entry: &str) -> Result<Self> {
        if origin.len() > 64 {
            return Err(Error::InvalidOrigin);
        }
        let authority = origin.strip_prefix("http://").ok_or(Error::InvalidOrigin)?;
        let address: SocketAddr = authority.parse().map_err(|_| Error::InvalidOrigin)?;
        if !address.ip().is_loopback() || address.port() < 1024 || authority != address.to_string()
        {
            return Err(Error::InvalidOrigin);
        }
        path::validate(entry)?;
        if ![".js", ".mjs", ".ts"]
            .iter()
            .any(|suffix| entry.ends_with(suffix))
        {
            return Err(Error::Unsupported);
        }
        Ok(Self {
            origin: origin.into(),
            entry: entry.into(),
        })
    }
    pub fn tags(&self) -> String {
        format!(
            "<script type=\"module\" src=\"{}/@vite/client\"></script>\n<script type=\"module\" src=\"{}{}\"></script>",
            self.origin,
            self.origin,
            path::url(&self.entry)
        )
    }
    pub fn origin(&self) -> &str {
        &self.origin
    }
}
