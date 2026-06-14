// Notedo — Edge Function que serve os eventos do usuário como um feed iCal (.ics)
// pra assinatura (webcal) no Google/Apple Calendar.
//
// A URL leva um token secreto: /functions/v1/calendar?token=XXX
// Usa a RPC public.calendar_feed (SECURITY DEFINER) com a ANON key — NÃO usa
// service_role. A RPC só devolve eventos do dono daquele token.
//
// Deploy:  supabase functions deploy calendar --no-verify-jwt
// (--no-verify-jwt porque clientes de calendário não mandam JWT; a segurança é
//  o token na URL + a RPC restrita.)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type FeedRow = {
  id: string;
  title: string;
  notes: string | null;
  starts_at: string;
  type: string;
  done: boolean;
};

/** Escapa texto conforme RFC 5545 (vírgula, ponto-e-vírgula, barra, quebra). */
function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Date -> formato iCal UTC: YYYYMMDDTHHMMSSZ. */
function ical(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildIcs(rows: FeedRow[]): string {
  const now = ical(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Notedo//Calendar//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Notedo",
    "X-WR-TIMEZONE:UTC",
  ];
  for (const r of rows) {
    const start = new Date(r.starts_at);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h de duração
    const status = r.done ? "COMPLETED" : "CONFIRMED";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.id}@notedo`,
      `DTSTAMP:${now}`,
      `DTSTART:${ical(start)}`,
      `DTEND:${ical(end)}`,
      `SUMMARY:${esc(r.title)}`,
      ...(r.notes ? [`DESCRIPTION:${esc(r.notes)}`] : []),
      `STATUS:${status}`,
      `CATEGORIES:${esc(r.type)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  // CRLF é o separador exigido pelo RFC 5545.
  return lines.join("\r\n");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("missing token", { status: 400 });
  }

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/calendar_feed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ p_token: token }),
  });

  if (!resp.ok) {
    return new Response("calendar unavailable", { status: 502 });
  }
  const rows = (await resp.json()) as FeedRow[];
  const ics = buildIcs(Array.isArray(rows) ? rows : []);

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="notedo.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
});
