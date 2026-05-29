// Evita abrir um console no Windows em release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    notedo_lib::run()
}
