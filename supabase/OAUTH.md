# OAuth (Google / GitHub) — setup no Supabase

O código do app já chama `signInWithOAuth` (botões na tela de login). Falta só
**habilitar os provedores no painel do Supabase** e registrar as URLs de retorno.

## 1. Redirect URLs (Authentication → URL Configuration)

Adicione em **Redirect URLs**:

```
http://localhost:3000/          (dev)
https://<seu-site>.vercel.app/  (produção web, quando publicar)
app.notedo://auth-callback      (Android — Fase 6)
http://localhost:8788/auth-callback  (Windows/Tauri — Fase 6)
```

Em **Site URL**, ponha a URL de produção (ou localhost em dev).

## 2. Google (Authentication → Sign In / Providers → Google)

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   crie um **OAuth 2.0 Client ID** (tipo *Web application*).
2. Em **Authorized redirect URIs**, cole a callback do Supabase (o painel mostra,
   algo como `https://srfhdopqbuykcvorxifh.supabase.co/auth/v1/callback`).
3. Copie **Client ID** e **Client Secret** → cole no provider Google do Supabase →
   ative → Save.

## 3. GitHub (Authentication → Sign In / Providers → GitHub)

1. GitHub → Settings → Developer settings → **OAuth Apps** → New (ou reuse o
   existente `Ov23liVqF1WbP1u0FLHI`).
2. **Authorization callback URL** = a callback do Supabase
   (`https://srfhdopqbuykcvorxifh.supabase.co/auth/v1/callback`).
3. Copie **Client ID** e gere um **Client Secret** → cole no provider GitHub do
   Supabase → ative → Save.

## Resultado

- **Site**: clicar em Google/GitHub redireciona, autentica e volta logado. ✅ (Fase 5)
- **Android/Windows**: precisa do deep link / loopback tratados no app (Fase 6).
