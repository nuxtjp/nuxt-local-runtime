use nuxtjp_vite_backend::{Error, ProductionAssets};
use serde_json::json;
#[test]
fn actual_vite_8_nuxt_ui_dynamic_source_keys_remain_opaque() {
    let source = include_bytes!("../test-data/vite-8-nuxt-ui.manifest.json");
    let assets = ProductionAssets::parse(source).unwrap();
    let plan = assets.entry("src/main.ts").unwrap();
    assert_eq!(plan.module_url(), "/assets/main-BpqMtYvL.js");
    assert_eq!(plan.styles(), ["/assets/main-_uh6pkNt.css"]);
    assert!(plan.preloads().is_empty());
    let files = assets.files();
    assert_eq!(files.len(), 3);
    assert!(files.contains("assets/Toast-BKW2bbNS.js"));
    assert!(
        files
            .iter()
            .all(|name| name.starts_with("assets/") && !name.contains(".."))
    );
}
#[test]
fn opaque_module_keys_cannot_relax_served_file_paths_or_missing_references() {
    for key in [
        "../node_modules/library/Component.vue",
        "virtual:component?mode=client",
    ] {
        let mut value = json!({"main.ts":{"file":"assets/main.js","isEntry":true,"imports":[key]},key:{"file":"assets/component.js"}});
        let assets = ProductionAssets::parse(&serde_json::to_vec(&value).unwrap()).unwrap();
        assert_eq!(
            assets.entry("main.ts").unwrap().preloads(),
            ["/assets/component.js"]
        );
        for bad in ["../outside.js", "https://evil.test/a.js", "assets/a?b.js"] {
            value[key]["file"] = json!(bad);
            assert!(ProductionAssets::parse(&serde_json::to_vec(&value).unwrap()).is_err());
        }
    }
    let value =
        json!({"main.ts":{"file":"assets/main.js","isEntry":true,"imports":["../missing"]}});
    assert!(matches!(
        ProductionAssets::parse(&serde_json::to_vec(&value).unwrap()),
        Err(Error::MissingImport)
    ));
    for bad in ["", "control\nkey"] {
        let value = json!({bad:{"file":"assets/a.js"}});
        assert!(ProductionAssets::parse(&serde_json::to_vec(&value).unwrap()).is_err());
    }
}
