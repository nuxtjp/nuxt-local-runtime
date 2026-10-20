use crate::HostError;
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::{TryRng, rngs::SysRng};

pub(crate) fn random_token() -> Result<String, HostError> {
    let mut bytes = [0_u8; 32];
    SysRng
        .try_fill_bytes(&mut bytes)
        .map_err(|_| HostError::Unavailable)?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}
