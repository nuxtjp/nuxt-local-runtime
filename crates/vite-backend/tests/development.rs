use nuxtjp_vite_backend::{DevelopmentAssets, Error, MAX_MANIFEST_BYTES, ProductionAssets};
use std::io::{Read, Result};
#[test]
fn development_is_explicit_loopback_and_does_not_probe_or_fallback() {
    let assets = DevelopmentAssets::new("http://127.0.0.1:5173", "src/main.ts").unwrap();
    assert_eq!(assets.origin(), "http://127.0.0.1:5173");
    assert_eq!(
        assets.tags(),
        "<script type=\"module\" src=\"http://127.0.0.1:5173/@vite/client\"></script>\n<script type=\"module\" src=\"http://127.0.0.1:5173/src/main.ts\"></script>"
    );
    assert!(DevelopmentAssets::new("http://[::1]:5173", "main.js").is_ok());
    for origin in [
        "http://localhost:5173",
        "https://127.0.0.1:5173",
        "http://127.0.0.1:80",
        "http://127.0.0.1:5173/",
        "http://0.0.0.0:5173",
        "http://127.0.0.1:5173@evil.invalid",
    ] {
        assert!(
            DevelopmentAssets::new(origin, "src/main.ts").is_err(),
            "{origin}"
        );
    }
    assert!(DevelopmentAssets::new("http://127.0.0.1:5173", "../main.ts").is_err());
}
struct Growing {
    read: usize,
}
impl Read for Growing {
    fn read(&mut self, bytes: &mut [u8]) -> Result<usize> {
        bytes.fill(b' ');
        self.read += bytes.len();
        Ok(bytes.len())
    }
}
#[test]
fn growing_reader_stops_after_the_limit_plus_one_and_partial_reads_fail() {
    let mut growing = Growing { read: 0 };
    assert!(matches!(
        ProductionAssets::read(&mut growing),
        Err(Error::Budget)
    ));
    assert_eq!(growing.read, MAX_MANIFEST_BYTES + 1);
    struct Broken;
    impl Read for Broken {
        fn read(&mut self, _: &mut [u8]) -> Result<usize> {
            Err(std::io::Error::other("fixture"))
        }
    }
    assert!(ProductionAssets::read(Broken).is_err());
}
