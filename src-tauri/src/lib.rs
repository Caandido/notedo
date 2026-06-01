use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::time::{Duration, Instant};

use tauri_plugin_opener::OpenerExt;

/// Página simples mostrada no navegador após o login concluir.
const DONE_PAGE: &str = "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>Notedo</title></head><body style=\"font-family:system-ui,-apple-system,sans-serif;background:#0a0a0b;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0\"><div style=\"text-align:center\"><div style=\"font-size:48px;font-weight:800;letter-spacing:-3px\">N</div><h2 style=\"font-weight:600;margin:.4rem 0\">Login concluído</h2><p style=\"opacity:.55;margin:0\">Pode voltar ao Notedo e fechar esta aba.</p></div></body></html>";

/// OAuth no desktop (Tauri): sobe um servidor loopback em 127.0.0.1:8788, abre a
/// URL do provedor no navegador do sistema e aguarda o redirect de callback,
/// devolvendo o path completo (ex.: "/auth-callback?code=...") pro frontend
/// trocar por sessão. Timeout de 3 min se o usuário não concluir.
#[tauri::command]
async fn oauth_login(app: tauri::AppHandle, url: String) -> Result<String, String> {
    let listener = TcpListener::bind("127.0.0.1:8788")
        .map_err(|e| format!("não consegui abrir a porta 8788 para o login: {e}"))?;
    listener
        .set_nonblocking(true)
        .map_err(|e| e.to_string())?;

    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| format!("não consegui abrir o navegador: {e}"))?;

    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let deadline = Instant::now() + Duration::from_secs(180);
        loop {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_nonblocking(false).ok();
                    let mut reader = BufReader::new(&stream);
                    let mut line = String::new();
                    reader.read_line(&mut line).map_err(|e| e.to_string())?;
                    let path = line
                        .split_whitespace()
                        .nth(1)
                        .unwrap_or("/")
                        .to_string();
                    let resp = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        DONE_PAGE.len(),
                        DONE_PAGE
                    );
                    stream.write_all(resp.as_bytes()).ok();
                    stream.flush().ok();
                    return Ok(path);
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    if Instant::now() >= deadline {
                        return Err("tempo esgotado aguardando o login".into());
                    }
                    std::thread::sleep(Duration::from_millis(200));
                }
                Err(e) => return Err(e.to_string()),
            }
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![oauth_login])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o app Tauri");
}
