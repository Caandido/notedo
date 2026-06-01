package app.notedo;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * Widget de tela inicial do Notedo. Lê o resumo publicado pelo app via
 * Capacitor Preferences (SharedPreferences "CapacitorStorage", chave "widget")
 * e desenha: próximo prazo, horas de hoje + streak, meta diária e um botão que
 * abre o cronômetro (deep link app.notedo://timer).
 *
 * Arquivo versionado em android-widget/ e injetado no projeto nativo gerado no
 * CI por scripts/inject-android-widget.mjs.
 */
public class NotedoWidgetProvider extends AppWidgetProvider {

    private static final String PREFS = "CapacitorStorage";
    private static final String KEY = "widget";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            manager.updateAppWidget(id, build(context));
        }
    }

    private RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_notedo);

        String next = "Sem prazos próximos";
        String today = "Hoje: 0h";
        String goal = "";

        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY, null);
            if (raw != null) {
                JSONObject o = new JSONObject(raw);

                JSONObject n = o.optJSONObject("next");
                if (n != null) {
                    String title = n.optString("title", "Prazo");
                    int days = n.optInt("daysLeft", 0);
                    String when = days <= 0 ? "hoje" : (days == 1 ? "amanhã" : "em " + days + " dias");
                    next = title + " · " + when;
                }

                int secs = o.optInt("todaySeconds", 0);
                int h = secs / 3600;
                int m = (secs % 3600) / 60;
                int streak = o.optInt("streak", 0);
                String t = h > 0 ? (h + "h " + m + "m") : (m + "m");
                today = "Hoje: " + t + (streak > 0 ? "   🔥 " + streak : "");

                JSONObject g = o.optJSONObject("goal");
                if (g != null) {
                    double cur = g.optDouble("current", 0);
                    double tgt = g.optDouble("target", 0);
                    String unit = g.optString("unit", "");
                    goal = "Meta: " + trim(cur) + "/" + trim(tgt) + " " + unit;
                }
            }
        } catch (Exception ignored) {
            // mantém os textos padrão
        }

        views.setTextViewText(R.id.widget_next, next);
        views.setTextViewText(R.id.widget_today, today);
        if (goal.isEmpty()) {
            views.setViewVisibility(R.id.widget_goal, android.view.View.GONE);
        } else {
            views.setViewVisibility(R.id.widget_goal, android.view.View.VISIBLE);
            views.setTextViewText(R.id.widget_goal, goal);
        }

        // Toque no corpo abre o app; botão abre direto o cronômetro.
        views.setOnClickPendingIntent(R.id.widget_root, openApp(context, "app.notedo://"));
        views.setOnClickPendingIntent(R.id.widget_timer_btn, openApp(context, "app.notedo://timer"));

        return views;
    }

    private PendingIntent openApp(Context context, String uri) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, uri.hashCode(), intent, flags);
    }

    private String trim(double v) {
        if (v == Math.floor(v)) return String.valueOf((long) v);
        return String.format(java.util.Locale.US, "%.1f", v);
    }
}
