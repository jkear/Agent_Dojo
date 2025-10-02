#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(
      tauri_plugin_stronghold::Builder::new(|password| {
        // Using a simple hash for demo - in production, use argon2 or similar
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        password.hash(&mut hasher);
        let hash = hasher.finish();
        
        // Convert to bytes for the key
        hash.to_le_bytes().to_vec()
      })
      .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
