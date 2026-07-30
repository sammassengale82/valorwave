use tiny_http::{Server, Response, Header};
use std::thread;
use tauri::{AppHandle, Emitter};
use crate::songdb::SongDatabase;

pub fn start_kiosk_server(app: AppHandle) {
    thread::spawn(move || {
        let server = Server::http("0.0.0.0:3030").unwrap();

        for request in server.incoming_requests() {
            let url = request.url().to_string();

            if url.starts_with("/signup") {
                let html = include_str!("../kiosk/signup.html");
                let response = Response::from_string(html)
                    .with_header(
                        Header::from_bytes("Content-Type", "text/html").unwrap()
                    );
                let _ = request.respond(response);
                continue;
            }

            if url.starts_with("/submit") {
                if let Some(query) = url.split('?').nth(1) {
                    let mut name = "";
                    let mut notes = "";

                    for p in query.split('&') {
                        if p.starts_with("name=") {
                            name = &p[5..];
                        }
                        if p.starts_with("notes=") {
                            notes = &p[6..];
                        }
                    }

                    let _ = app.emit(
                        "kiosk_new_singer",
                        serde_json::json!({ "name": name, "notes": notes }),
                    );

                    let _ = request.respond(Response::from_string("OK"));
                }
                continue;
            }

            if url == "/songbook.json" {
                let db = SongDatabase::load();
                let json = serde_json::to_string(&db.songs).unwrap();
                let response = Response::from_string(json)
                    .with_header(
                        Header::from_bytes("Content-Type", "application/json").unwrap()
                    );
                let _ = request.respond(response);
                continue;
            }

            if url.starts_with("/request") {
                if let Some(query) = url.split('?').nth(1) {
                    let mut song = "";

                    for p in query.split('&') {
                        if p.starts_with("song=") {
                            song = &p[5..];
                        }
                    }

                    let _ = app.emit(
                        "kiosk_song_request",
                        serde_json::json!({ "song": song }),
                    );

                    let _ = request.respond(Response::from_string("OK"));
                }
                continue;
            }

            let _ = request.respond(Response::from_string("404"));
        }
    });
}
