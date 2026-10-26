use nuxtjp_vite_backend::{Error, MAX_MANIFEST_BYTES, ProductionAssets};
use serde_json::{Value, json};
fn sample() -> Value {
    json!({
        "src/main.ts":{"file":"assets/main-A.js","isEntry":true,"css":["assets/main.css"],"imports":["_shared.js"],"dynamicImports":["src/lazy.ts"]},
        "_shared.js":{"file":"assets/shared-B.js","css":["assets/shared.css","assets/main.css"]},
        "src/lazy.ts":{"file":"assets/lazy-C.js","isDynamicEntry":true,"assets":["assets/logo.svg"]}
    })
}
fn parse(v: Value) -> Result<ProductionAssets, Error> {
    ProductionAssets::parse(&serde_json::to_vec(&v).unwrap())
}
#[test]
fn actual_parser_generates_deduplicated_ordered_css_module_and_static_preloads() {
    let assets = parse(sample()).unwrap();
    let plan = assets.entry("src/main.ts").unwrap();
    assert_eq!(plan.module_url(), "/assets/main-A.js");
    assert_eq!(plan.styles(), ["/assets/main.css", "/assets/shared.css"]);
    assert_eq!(plan.preloads(), ["/assets/shared-B.js"]);
    assert!(!plan.tags().contains("lazy-C"));
    assert_eq!(assets.files().len(), 6);
    assert_eq!(
        plan.tags(),
        "<link rel=\"stylesheet\" href=\"/assets/main.css\">\n<link rel=\"stylesheet\" href=\"/assets/shared.css\">\n<script type=\"module\" src=\"/assets/main-A.js\"></script>\n<link rel=\"modulepreload\" href=\"/assets/shared-B.js\">"
    );
    assert!(matches!(assets.entry("missing"), Err(Error::MissingEntry)));
    assert!(matches!(
        assets.entry("_shared.js"),
        Err(Error::MissingEntry)
    ));
}
#[test]
fn missing_references_and_unknown_fields_fail_instead_of_partial_html() {
    for field in ["imports", "dynamicImports"] {
        let mut value = sample();
        value["src/main.ts"][field] = json!(["missing.js"]);
        assert!(matches!(parse(value), Err(Error::MissingImport)));
    }
    let mut value = sample();
    value["src/main.ts"]["integrity"] = json!("unsupported");
    assert!(matches!(parse(value), Err(Error::Unsupported)));
    assert!(matches!(
        ProductionAssets::parse(b"{"),
        Err(Error::InvalidManifest)
    ));
}
#[test]
fn relative_paths_are_validated_and_urls_encode_individual_unicode_segments() {
    for bad in [
        "../outside.js",
        "/absolute.js",
        "https://elsewhere/a.js",
        "assets/a%2fb.js",
        "assets/a\\b.js",
        "assets/a?b.js",
        "assets/a\"b.js",
    ] {
        let mut value = sample();
        value["src/main.ts"]["file"] = json!(bad);
        assert!(parse(value).is_err(), "{bad}");
    }
    let mut value = sample();
    value["src/main.ts"]["file"] = json!("assets/会社 名.js");
    assert_eq!(
        parse(value)
            .unwrap()
            .entry("src/main.ts")
            .unwrap()
            .module_url(),
        "/assets/%E4%BC%9A%E7%A4%BE%20%E5%90%8D.js"
    );
}
#[test]
fn cycles_terminate_and_manifest_graph_depth_is_bounded_before_traversal() {
    let value = json!({"main.ts":{"file":"assets/a.js","isEntry":true,"imports":["b.js"]},
        "b.js":{"file":"assets/b.js","imports":["main.ts"]}});
    let assets = parse(value).unwrap();
    assert_eq!(
        assets.entry("main.ts").unwrap().preloads(),
        ["/assets/b.js"]
    );
    let mut chunks = serde_json::Map::new();
    for n in 0..18 {
        chunks.insert(format!("{n}.js"),json!({"file":format!("assets/{n}.js"),"imports":if n<17 {vec![format!("{}.js",n+1)]} else {vec![]}}));
    }
    assert!(matches!(parse(Value::Object(chunks)), Err(Error::Budget)));
}
#[test]
fn oversized_input_chunk_and_reference_counts_are_refused() {
    assert!(matches!(
        ProductionAssets::parse(&vec![b' '; MAX_MANIFEST_BYTES + 1]),
        Err(Error::Budget)
    ));
    let mut chunks = serde_json::Map::new();
    for n in 0..257 {
        chunks.insert(format!("{n}.js"), json!({"file":format!("assets/{n}.js")}));
    }
    assert!(matches!(parse(Value::Object(chunks)), Err(Error::Budget)));
    let mut value = sample();
    value["src/main.ts"]["css"] = json!(vec!["assets/main.css"; 65]);
    assert!(matches!(parse(value), Err(Error::Budget)));
    let mut value = sample();
    value["_shared.js"]["file"] = json!("assets/main-A.js");
    assert!(matches!(parse(value), Err(Error::InvalidManifest)));
}
