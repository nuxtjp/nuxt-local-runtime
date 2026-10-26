use crate::{Error, Result};
use percent_encoding::{AsciiSet, NON_ALPHANUMERIC, utf8_percent_encode};
const SEGMENT: &AsciiSet = &NON_ALPHANUMERIC
    .remove(b'-')
    .remove(b'_')
    .remove(b'.')
    .remove(b'~');

pub(crate) fn validate(value: &str) -> Result<()> {
    if value.is_empty() || value.len() > 1024 || value.split('/').count() > 32 {
        return Err(Error::InvalidPath);
    }
    for part in value.split('/') {
        if part.is_empty()
            || matches!(part, "." | "..")
            || part.trim() != part
            || part
                .chars()
                .any(|c| c.is_control() || r#"\%?#:"'<>"#.contains(c))
        {
            return Err(Error::InvalidPath);
        }
    }
    Ok(())
}
pub(crate) fn url(value: &str) -> String {
    format!(
        "/{}",
        value
            .split('/')
            .map(|part| utf8_percent_encode(part, SEGMENT).to_string())
            .collect::<Vec<_>>()
            .join("/")
    )
}
