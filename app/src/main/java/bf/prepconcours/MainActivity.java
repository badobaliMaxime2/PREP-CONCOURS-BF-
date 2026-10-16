package bf.prepconcours;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.LinearLayout;
import android.window.OnBackInvokedDispatcher;
import java.util.Locale;

public class MainActivity extends Activity {
    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private int ttsLang = TextToSpeech.LANG_NOT_SUPPORTED;
    private static final String CH = "concours";

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        buildUi();
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u = r.getUrl().toString();
                if (u.startsWith("file:///android_asset")) return false;
                openExternal(u);
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("file:///android_asset/www/index.html");
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                ttsLang = tts.setLanguage(Locale.FRANCE);
                if (ttsLang == TextToSpeech.LANG_MISSING_DATA || ttsLang == TextToSpeech.LANG_NOT_SUPPORTED)
                    ttsLang = tts.setLanguage(Locale.FRENCH);
                ttsReady = true;
            }
        });
        if (Build.VERSION.SDK_INT >= 33)
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
    }

    /** Écran de bord à bord (obligatoire dès l'API 35) : bandes vertes/blanches sous les barres système, WebView entre les deux. */
    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFFFFFFFF);
        final View top = new View(this);
        top.setBackgroundColor(0xFF007A3A);
        final View bottom = new View(this);
        bottom.setBackgroundColor(0xFFFFFFFF);
        root.addView(top, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0));
        root.addView(web, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(bottom, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0));
        root.setOnApplyWindowInsetsListener((v, w) -> {
            int t, bt, l, r;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets sb = w.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = w.getInsets(WindowInsets.Type.ime());
                t = sb.top; bt = Math.max(sb.bottom, ime.bottom); l = sb.left; r = sb.right;
            } else {
                t = w.getSystemWindowInsetTop(); bt = w.getSystemWindowInsetBottom();
                l = w.getSystemWindowInsetLeft(); r = w.getSystemWindowInsetRight();
            }
            top.getLayoutParams().height = t;
            bottom.getLayoutParams().height = bt;
            v.setPadding(l, 0, r, 0);
            top.requestLayout();
            bottom.requestLayout();
            return Build.VERSION.SDK_INT >= 30 ? WindowInsets.CONSUMED : w.consumeSystemWindowInsets();
        });
        setContentView(root);
        // icônes sombres sur la barre de navigation blanche
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) c.setSystemBarsAppearance(WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
        } else {
            View d = getWindow().getDecorView();
            d.setSystemUiVisibility(d.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
        // geste « retour » prédictif (obligatoire en API 36) : onBackPressed n'est plus appelé
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, () -> handleBack());
        }
    }

    private void handleBack() {
        web.evaluateJavascript("window.handleBack&&window.handleBack()", v -> {
            if (!"true".equals(v)) finish();
        });
    }

    private void openExternal(String u) {
        try {
            Intent i = new Intent(u.startsWith("tel:") ? Intent.ACTION_DIAL : Intent.ACTION_VIEW, Uri.parse(u));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) { /* aucune application pour ouvrir le lien */ }
    }

    class Bridge {
        @JavascriptInterface public void open(String u) { runOnUiThread(() -> openExternal(u)); }

        /** Ouvre un PDF embarqué (assets/www/pdf/) avec le lecteur PDF du téléphone. Retourne "ok", "missing" ou "noapp". */
        @JavascriptInterface public String openPdf(String name) {
            try {
                if (name == null || name.contains("/") || name.contains("..")) return "missing";
                java.io.File dir = new java.io.File(getCacheDir(), "pdf");
                dir.mkdirs();
                java.io.File out = new java.io.File(dir, name);
                try (java.io.InputStream in = getAssets().open("www/pdf/" + name);
                     java.io.FileOutputStream os = new java.io.FileOutputStream(out)) {
                    byte[] buf = new byte[16384]; int n;
                    while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
                }
                final Uri u = new Uri.Builder().scheme("content").authority(PdfProvider.AUTH).appendPath(name).build();
                runOnUiThread(() -> {
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW);
                        i.setDataAndType(u, "application/pdf");
                        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i);
                    } catch (Exception e) { android.widget.Toast.makeText(MainActivity.this, "Installe une application de lecture PDF", android.widget.Toast.LENGTH_LONG).show(); }
                });
                return "ok";
            } catch (java.io.FileNotFoundException e) { return "missing";
            } catch (Exception e) { return "noapp"; }
        }

        @JavascriptInterface public String deviceId() {
            String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
            if (id == null || id.length() < 6) return "";
            return id.substring(0, Math.min(8, id.length())).toUpperCase(Locale.ROOT);
        }

        /** Lecture vocale native. Retourne "ok", "noinit" ou "nolang". */
        @JavascriptInterface public String speak(String text) {
            if (tts == null || !ttsReady) return "noinit";
            if (ttsLang == TextToSpeech.LANG_MISSING_DATA || ttsLang == TextToSpeech.LANG_NOT_SUPPORTED) return "nolang";
            tts.stop();
            int max = TextToSpeech.getMaxSpeechInputLength() - 10;
            for (int i = 0, n = 0; i < text.length(); i += max, n++) {
                String part = text.substring(i, Math.min(text.length(), i + max));
                tts.speak(part, n == 0 ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, null, "u" + n);
            }
            return "ok";
        }
        @JavascriptInterface public void ttsSettings() {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent("com.android.settings.TTS_SETTINGS");
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception e) {
                    try {
                        Intent j = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                        j.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(j);
                    } catch (Exception e2) { /* rien */ }
                }
            });
        }
        @JavascriptInterface public void stopSpeak() { if (tts != null) tts.stop(); }

        @JavascriptInterface public void notify(String title, String text) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            nm.createNotificationChannel(new NotificationChannel(CH, "Concours", NotificationManager.IMPORTANCE_HIGH));
            PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0,
                new Intent(MainActivity.this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
            android.app.Notification.Builder nb = new android.app.Notification.Builder(MainActivity.this, CH)
                .setSmallIcon(R.drawable.ic_notif).setContentTitle(title).setContentText(text)
                .setStyle(new android.app.Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi).setAutoCancel(true);
            nm.notify((int) (System.currentTimeMillis() % 100000), nb.build());
        }
    }

    @Override public void onBackPressed() {   // Android < 13
        handleBack();
    }

    @Override protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        super.onDestroy();
    }
}
