// Injeta o widget de tela inicial (Android) no projeto nativo gerado no CI.
// Copia os fontes de android-widget/ para android/app/src/main/ e registra o
// <receiver> no AndroidManifest. Idempotente. Roda após `cap add android` e o
// patch de manifest, antes de `cap sync`.
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";

const SRC = "android-widget";
const DST = "android/app/src/main";
const MANIFEST = "android/app/src/main/AndroidManifest.xml";

if (!existsSync("android")) {
  console.error("Projeto android/ não encontrado — rode `npx cap add android` antes.");
  process.exit(1);
}

function copyTree(from, to) {
  for (const entry of readdirSync(from)) {
    const s = join(from, entry);
    const d = join(to, entry);
    if (statSync(s).isDirectory()) {
      copyTree(s, d);
    } else {
      mkdirSync(dirname(d), { recursive: true });
      copyFileSync(s, d);
      console.log("widget: copiado", d);
    }
  }
}

copyTree(SRC, DST);

// Registra o <receiver> antes de </application> (se ainda não existir).
let xml = readFileSync(MANIFEST, "utf8");
if (xml.includes("NotedoWidgetProvider")) {
  console.log("widget: <receiver> já presente — nada a fazer.");
  process.exit(0);
}

const receiver = `
        <receiver
            android:name=".NotedoWidgetProvider"
            android:exported="false">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_notedo_info" />
        </receiver>
`;

const idx = xml.lastIndexOf("</application>");
if (idx === -1) {
  console.error("widget: </application> não encontrado no manifest.");
  process.exit(1);
}
xml = xml.slice(0, idx) + receiver + "    " + xml.slice(idx);
writeFileSync(MANIFEST, xml, "utf8");
console.log("widget: <receiver> injetado no AndroidManifest.");
