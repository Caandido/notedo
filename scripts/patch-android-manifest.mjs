// Injeta o intent-filter do deep link OAuth (app.notedo://auth-callback) no
// AndroidManifest gerado pelo Capacitor (android/ é gerado no CI).
// Idempotente: não duplica se já existir.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const path = "android/app/src/main/AndroidManifest.xml";
if (!existsSync(path)) {
  console.error("AndroidManifest não encontrado em", path);
  process.exit(1);
}

let xml = readFileSync(path, "utf8");

if (xml.includes('android:scheme="app.notedo"')) {
  console.log("intent-filter do deep link já presente — nada a fazer.");
  process.exit(0);
}

const filter = `
            <intent-filter android:autoVerify="false">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="app.notedo" />
            </intent-filter>
        </activity>`;

// Insere antes do primeiro </activity> (a MainActivity).
const idx = xml.indexOf("</activity>");
if (idx === -1) {
  console.error("</activity> não encontrado no manifest.");
  process.exit(1);
}
xml = xml.slice(0, idx) + filter.trimStart() + xml.slice(idx + "</activity>".length);
writeFileSync(path, xml, "utf8");
console.log("intent-filter do deep link injetado no AndroidManifest.");
