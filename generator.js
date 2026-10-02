const fs = require("fs");
const path = require("path");

function safe(s) {
  return String(s || "MovixaApp")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^(\d)/, "App$1") || "MovixaApp";
}

function java(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
}

function w(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function generateAndroidProject(p, d) {

  const appName = safe(p.name);
  const ns = "com.movixa.generated." + appName.toLowerCase();
  const components = Array.isArray(p.components) ? p.components : [];

  let declarations = "";
  let setup = "";

  components.forEach((c, i) => {

    const type = String(c.type || "").toLowerCase();
    const id = "movixa_" + i;

    const value = String(
      c.text ??
      c.url ??
      c.value ??
      ""
    );

    if (type === "text") {

      declarations += `
        TextView view${i} = new TextView(this);
        view${i}.setText("${java(value || "Text")}");
        view${i}.setTextSize(18);
        view${i}.setPadding(12, 12, 12, 12);
        root.addView(view${i});
`;

    } else if (type === "button") {

      declarations += `
        Button view${i} = new Button(this);
        view${i}.setText("${java(value || "Button")}");
        root.addView(view${i});

        view${i}.setOnClickListener(v -> {
            Toast.makeText(
                MainActivity.this,
                "${java(value || "Button")} clicked",
                Toast.LENGTH_SHORT
            ).show();
        });
`;

    } else if (type === "image") {

      declarations += `
        ImageView view${i} = new ImageView(this);
        view${i}.setLayoutParams(
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                350
            )
        );
        view${i}.setScaleType(ImageView.ScaleType.CENTER_CROP);
        root.addView(view${i});

        loadImage(view${i}, "${java(value)}");
`;

    } else if (type === "video") {

      declarations += `
        VideoView view${i} = new VideoView(this);

        LinearLayout.LayoutParams videoParams${i} =
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                500
            );

        videoParams${i}.setMargins(0, 12, 0, 12);
        view${i}.setLayoutParams(videoParams${i});

        root.addView(view${i});

        MediaController controller${i} =
            new MediaController(this);

        controller${i}.setAnchorView(view${i});
        view${i}.setMediaController(controller${i});

        Uri videoUri${i} =
            Uri.parse("${java(value)}");

        view${i}.setVideoURI(videoUri${i});

        view${i}.setOnPreparedListener(mp -> {
            mp.setLooping(false);
            view${i}.requestFocus();
            view${i}.start();
        });

        view${i}.setOnErrorListener((mp, what, extra) -> {
            Toast.makeText(
                MainActivity.this,
                "Video play नहीं हो पाया",
                Toast.LENGTH_LONG
            ).show();
            return true;
        });
`;

    } else if (type === "webview" || type === "url") {

      declarations += `
        WebView view${i} = new WebView(this);

        view${i}.setLayoutParams(
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                600
            )
        );

        view${i}.getSettings().setJavaScriptEnabled(true);
        view${i}.getSettings().setDomStorageEnabled(true);
        view${i}.getSettings().setMediaPlaybackRequiresUserGesture(false);

        view${i}.setWebViewClient(new WebViewClient());

        root.addView(view${i});

        view${i}.loadUrl("${java(value)}");
`;

    }
  });

  w(
    path.join(d, "settings.gradle"),
`pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${appName}"
include(":app")
`
  );

  w(
    path.join(d, "build.gradle"),
`plugins {
    id 'com.android.application' version '8.7.3' apply false
}
`
  );

  w(
    path.join(d, "gradle.properties"),
`org.gradle.daemon=false
org.gradle.jvmargs=-Xmx256m -XX:MaxMetaspaceSize=128m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
`
  );

  w(
    path.join(d, "app/build.gradle"),
`plugins {
    id 'com.android.application'
}

android {
    namespace '${ns}'
    compileSdk 35

    defaultConfig {
        applicationId '${ns}'
        minSdk 23
        targetSdk 35
        versionCode 1
        versionName '1.0'
    }
}
`
  );

  w(
    path.join(d, "app/src/main/AndroidManifest.xml"),
`<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET"/>

    <application
        android:theme="@style/AppTheme"
        android:label="${appName}"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>

        </activity>

    </application>

</manifest>
`
  );

  w(
    path.join(d, "app/src/main/res/values/styles.xml"),
`<resources>

    <style
        name="AppTheme"
        parent="android:style/Theme.Material.Light.NoActionBar">

        <item name="android:fontFamily">sans</item>
        <item name="android:colorAccent">#008577</item>

    </style>

</resources>
`
  );

  w(
    path.join(
      d,
      "app/src/main/java",
      ...ns.split("."),
      "MainActivity.java"
    ),
`package ${ns};

import android.app.Activity;
import android.os.Bundle;
import android.widget.*;
import android.view.*;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;
import android.media.MediaPlayer;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private LinearLayout root;
    private final ExecutorService executor =
        Executors.newCachedThreadPool();

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);

        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(16, 16, 16, 16);

        ScrollView scroll = new ScrollView(this);
        scroll.addView(root);

        setContentView(scroll);

${declarations}
    }

    private void loadImage(ImageView imageView, String url) {

        if (url == null || url.trim().isEmpty()) {
            return;
        }

        executor.execute(() -> {

            try {

                URL imageUrl = new URL(url);

                HttpURLConnection connection =
                    (HttpURLConnection) imageUrl.openConnection();

                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);
                connection.setDoInput(true);
                connection.connect();

                InputStream input =
                    connection.getInputStream();

                Bitmap bitmap =
                    BitmapFactory.decodeStream(input);

                input.close();
                connection.disconnect();

                runOnUiThread(() -> {

                    if (bitmap != null) {
                        imageView.setImageBitmap(bitmap);
                    } else {
                        Toast.makeText(
                            MainActivity.this,
                            "Image load नहीं हुई",
                            Toast.LENGTH_SHORT
                        ).show();
                    }

                });

            } catch (Exception e) {

                runOnUiThread(() ->
                    Toast.makeText(
                        MainActivity.this,
                        "Image load नहीं हुई",
                        Toast.LENGTH_SHORT
                    ).show()
                );
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdownNow();
    }
}
`
  );
}

module.exports = { generateAndroidProject };
