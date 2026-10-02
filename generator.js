 const fs = require("fs");
const path = require("path");

function safe(s) {
  return String(s || "MovixaApp")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^(\d)/, "App$1") || "MovixaApp";
}

function xml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function java(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function w(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function getValue(c) {
  return c.url || c.src || c.value || c.text || "";
}

function generateAndroidProject(p, d) {

  const n = safe(p.name);
  const ns = "com.movixa.generated." + n.toLowerCase();
  const cs = Array.isArray(p.components) ? p.components : [];

  const views = cs.map((c, i) => {

    const id = "movixa_" + i;

    if (c.type === "button") {
      return `
        <Button
            android:id="@+id/${id}"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="${xml(c.text || "Button")}"
            android:layout_marginBottom="12dp" />`;
    }

    if (c.type === "image") {
      return `
        <ImageView
            android:id="@+id/${id}"
            android:layout_width="match_parent"
            android:layout_height="200dp"
            android:contentDescription="Image"
            android:scaleType="centerCrop"
            android:layout_marginBottom="12dp" />`;
    }

    if (c.type === "video") {
      return `
        <VideoView
            android:id="@+id/${id}"
            android:layout_width="match_parent"
            android:layout_height="230dp"
            android:layout_marginBottom="12dp" />`;
    }

    if (c.type === "url" || c.type === "webview") {
      return `
        <WebView
            android:id="@+id/${id}"
            android:layout_width="match_parent"
            android:layout_height="350dp"
            android:layout_marginBottom="12dp" />`;
    }

    return `
        <TextView
            android:id="@+id/${id}"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="${xml(c.text || "Text")}"
            android:textSize="18sp"
            android:padding="12dp"
            android:layout_marginBottom="8dp" />`;

  }).join("\n");

  const actions = cs.map((c, i) => {

    const id = "movixa_" + i;
    const value = getValue(c);

    if (c.type === "button") {
      const label = java(c.text || "Button");

      return `
        Button button${i} = findViewById(R.id.${id});
        button${i}.setOnClickListener(v ->
            Toast.makeText(
                this,
                "${label} clicked",
                Toast.LENGTH_SHORT
            ).show()
        );`;
    }

    if (c.type === "image" && value) {
      return `
        ImageView image${i} = findViewById(R.id.${id});
        loadImage(image${i}, "${java(value)}");`;
    }

    if (c.type === "video" && value) {
      return `
        VideoView video${i} = findViewById(R.id.${id});
        video${i}.setVideoURI(Uri.parse("${java(value)}"));

        MediaController controller${i} =
            new MediaController(this);

        controller${i}.setAnchorView(video${i});
        video${i}.setMediaController(controller${i});

        video${i}.setOnPreparedListener(mp -> {
            mp.setLooping(false);
        });`;
    }

    if ((c.type === "url" || c.type === "webview") && value) {
      return `
        WebView web${i} = findViewById(R.id.${id});

        web${i}.getSettings().setJavaScriptEnabled(true);
        web${i}.getSettings().setDomStorageEnabled(true);
        web${i}.setWebViewClient(new WebViewClient());

        web${i}.loadUrl("${java(value)}");`;
    }

    return "";

  }).join("\n");

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

rootProject.name="${n}"
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
org.gradle.jvmargs=-Xmx256m -Dfile.encoding=UTF-8
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
        android:label="${xml(p.name || "Movixa App")}"
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

</manifest>`
  );

  w(
    path.join(d, "app/src/main/res/layout/activity_main.xml"),
`<ScrollView
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <LinearLayout
        android:orientation="vertical"
        android:padding="16dp"
        android:layout_width="match_parent"
        android:layout_height="wrap_content">

${views || `
        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Built with Movixa App Maker"
            android:textSize="18sp"
            android:padding="12dp"/>`}

    </LinearLayout>

</ScrollView>`
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

</resources>`
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
import android.os.Handler;
import android.os.Looper;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.VideoView;
import android.widget.MediaController;
import android.widget.Toast;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private final ExecutorService executor =
        Executors.newSingleThreadExecutor();

    private final Handler handler =
        new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle b) {

        super.onCreate(b);

        setContentView(R.layout.activity_main);

${actions}

    }

    private void loadImage(ImageView imageView, String url) {

        executor.execute(() -> {

            HttpURLConnection connection = null;
            InputStream input = null;

            try {

                URL imageUrl = new URL(url);

                connection =
                    (HttpURLConnection) imageUrl.openConnection();

                connection.setConnectTimeout(10000);
                connection.setReadTimeout(15000);
                connection.setDoInput(true);
                connection.connect();

                input = connection.getInputStream();

                Bitmap bitmap =
                    BitmapFactory.decodeStream(input);

                handler.post(() -> {

                    if (bitmap != null) {
                        imageView.setImageBitmap(bitmap);
                    } else {
                        Toast.makeText(
                            this,
                            "Image load failed",
                            Toast.LENGTH_SHORT
                        ).show();
                    }

                });

            } catch (Exception e) {

                handler.post(() ->
                    Toast.makeText(
                        this,
                        "Image load failed",
                        Toast.LENGTH_SHORT
                    ).show()
                );

            } finally {

                try {
                    if (input != null) {
                        input.close();
                    }
                } catch (Exception ignored) {}

                if (connection != null) {
                    connection.disconnect();
                }
            }

        });
    }

    @Override
    protected void onDestroy() {

        executor.shutdownNow();

        super.onDestroy();
    }
}
`
  );
}

module.exports = {
  generateAndroidProject
};   
