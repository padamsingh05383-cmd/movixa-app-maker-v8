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

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function generateAndroidProject(project, dir) {
  const appName = safe(project.name);

  const namespace =
    "com.movixa.generated." +
    appName.toLowerCase();

  const components =
    Array.isArray(project.components)
      ? project.components
      : [];

  let code = "";

  let hasVideo = false;
  let hasWebView = false;

  components.forEach((c) => {
    const type =
      String(c.type || "").toLowerCase();

    if (type === "video") {
      hasVideo = true;
    }

    if (
      type === "webview" ||
      type === "url"
    ) {
      hasWebView = true;
    }
  });

  components.forEach((c, i) => {
    const type =
      String(c.type || "").toLowerCase();

    const value = String(
      c.text ??
      c.url ??
      c.value ??
      ""
    );

    if (type === "text") {

      code += `
        TextView view${i} = new TextView(this);

        view${i}.setText("${java(value || "Text")}");
        view${i}.setTextSize(18);

        view${i}.setPadding(
            12,
            12,
            12,
            12
        );

        root.addView(view${i});
`;

    } else if (type === "button") {

      const action =
        String(c.action || "toast")
          .toLowerCase();

      const actionValue =
        String(c.actionValue || "");

      let clickCode = "";

      if (action === "url") {

        clickCode = `
            try {

                Intent intent =
                    new Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse("${java(actionValue)}")
                    );

                startActivity(intent);

            } catch (Exception e) {

                Toast.makeText(
                    MainActivity.this,
                    "URL open नहीं हो पाया",
                    Toast.LENGTH_SHORT
                ).show();
            }
`;

      } else if (action === "webview") {

        if (hasWebView) {

          clickCode = `
            if (firstWebView != null) {

                firstWebView.loadUrl(
                    "${java(actionValue)}"
                );

            } else {

                Toast.makeText(
                    MainActivity.this,
                    "WebView नहीं मिला",
                    Toast.LENGTH_SHORT
                ).show();
            }
`;

        } else {

          clickCode = `
            Toast.makeText(
                MainActivity.this,
                "पहले WebView component जोड़ें",
                Toast.LENGTH_SHORT
            ).show();
`;
        }

      } else if (action === "video") {

        if (hasVideo) {

          if (actionValue.trim()) {

            clickCode = `
            if (firstVideoView != null) {

                firstVideoView.setVideoURI(
                    Uri.parse("${java(actionValue)}")
                );

                firstVideoView.start();

            } else {

                Toast.makeText(
                    MainActivity.this,
                    "Video नहीं मिला",
                    Toast.LENGTH_SHORT
                ).show();
            }
`;

          } else {

            clickCode = `
            if (firstVideoView != null) {

                firstVideoView.start();

            } else {

                Toast.makeText(
                    MainActivity.this,
                    "Video नहीं मिला",
                    Toast.LENGTH_SHORT
                ).show();
            }
`;
          }

        } else {

          clickCode = `
            Toast.makeText(
                MainActivity.this,
                "पहले Video component जोड़ें",
                Toast.LENGTH_SHORT
            ).show();
`;
        }

      } else {

        clickCode = `
            Toast.makeText(
                MainActivity.this,
                "${java(
                  actionValue ||
                  ((value || "Button") + " clicked")
                )}",
                Toast.LENGTH_SHORT
            ).show();
`;
      }

      code += `
        Button view${i} =
            new Button(this);

        view${i}.setText(
            "${java(value || "Button")}"
        );

        root.addView(view${i});

        view${i}.setOnClickListener(v -> {
${clickCode}
        });
`;

    } else if (type === "image") {

      code += `
        ImageView view${i} =
            new ImageView(this);

        view${i}.setLayoutParams(
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                350
            )
        );

        view${i}.setScaleType(
            ImageView.ScaleType.CENTER_CROP
        );

        root.addView(view${i});

        loadImage(
            view${i},
            "${java(value)}"
        );
`;

    } else if (type === "video") {

      code += `
        VideoView view${i} =
            new VideoView(this);

        LinearLayout.LayoutParams
            videoParams${i} =
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                500
            );

        videoParams${i}.setMargins(
            0,
            12,
            0,
            12
        );

        view${i}.setLayoutParams(
            videoParams${i}
        );

        root.addView(view${i});

        if (firstVideoView == null) {
            firstVideoView = view${i};
        }

        MediaController controller${i} =
            new MediaController(this);

        controller${i}.setAnchorView(
            view${i}
        );

        view${i}.setMediaController(
            controller${i}
        );

        Uri videoUri${i} =
            Uri.parse("${java(value)}");

        view${i}.setVideoURI(
            videoUri${i}
        );

        view${i}.setOnPreparedListener(
            mp -> {

                mp.setLooping(false);

                view${i}.requestFocus();

                view${i}.start();
            }
        );

        view${i}.setOnErrorListener(
            (mp, what, extra) -> {

                Toast.makeText(
                    MainActivity.this,
                    "Video play नहीं हो पाया",
                    Toast.LENGTH_LONG
                ).show();

                return true;
            }
        );
`;

    } else if (
      type === "webview" ||
      type === "url"
    ) {

      code += `
        WebView view${i} =
            new WebView(this);

        view${i}.setLayoutParams(
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                600
            )
        );

        view${i}.getSettings()
            .setJavaScriptEnabled(true);

        view${i}.getSettings()
            .setDomStorageEnabled(true);

        view${i}.getSettings()
            .setMediaPlaybackRequiresUserGesture(false);

        view${i}.setWebViewClient(
            new WebViewClient()
        );

        root.addView(view${i});

        if (firstWebView == null) {
            firstWebView = view${i};
        }

        view${i}.loadUrl(
            "${java(value)}"
        );
`;
    }
  });

  writeFile(
    path.join(dir, "settings.gradle"),
`pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = "${appName}"

include(":app")
`
  );

  writeFile(
    path.join(dir, "build.gradle"),
`plugins {
    id 'com.android.application' version '8.7.3' apply false
}
`
  );

  writeFile(
    path.join(dir, "gradle.properties"),
`org.gradle.daemon=false
org.gradle.jvmargs=-Xmx256m -XX:MaxMetaspaceSize=128m -Dfile.encoding=UTF-8
org.gradle.workers.max=1
org.gradle.parallel=false
org.gradle.caching=false
android.useAndroidX=true
android.nonTransitiveRClass=true
`
  );

  writeFile(
    path.join(dir, "app/build.gradle"),
`plugins {
    id 'com.android.application'
}

android {
    namespace '${namespace}'
    compileSdk 35

    defaultConfig {
        applicationId '${namespace}'
        minSdk 23
        targetSdk 35
        versionCode 1
        versionName '1.0'
    }
}
`
  );

  writeFile(
    path.join(
      dir,
      "app/src/main/AndroidManifest.xml"
    ),
`<manifest
    xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission
        android:name="android.permission.INTERNET"/>

    <application
        android:theme="@style/AppTheme"
        android:label="${appName}"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true">

            <intent-filter>

                <action
                    android:name="android.intent.action.MAIN"/>

                <category
                    android:name="android.intent.category.LAUNCHER"/>

            </intent-filter>

        </activity>

    </application>

</manifest>
`
  );

  writeFile(
    path.join(
      dir,
      "app/src/main/res/values/styles.xml"
    ),
`<resources>

    <style
        name="AppTheme"
        parent="android:style/Theme.Material.Light.NoActionBar">

        <item name="android:fontFamily">
            sans
        </item>

        <item name="android:colorAccent">
            #008577
        </item>

    </style>

</resources>
`
  );

  writeFile(
    path.join(
      dir,
      "app/src/main/java",
      ...namespace.split("."),
      "MainActivity.java"
    ),
`package ${namespace};

import android.app.Activity;
import android.os.Bundle;

import android.widget.*;
import android.view.*;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import android.webkit.WebView;
import android.webkit.WebViewClient;

import android.net.Uri;
import android.content.Intent;

import java.io.InputStream;

import java.net.HttpURLConnection;
import java.net.URL;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private LinearLayout root;

    private VideoView firstVideoView;

    private WebView firstWebView;

    private final ExecutorService executor =
        Executors.newCachedThreadPool();

    @Override
    protected void onCreate(Bundle b) {

        super.onCreate(b);

        root =
            new LinearLayout(this);

        root.setOrientation(
            LinearLayout.VERTICAL
        );

        root.setPadding(
            16,
            16,
            16,
            16
        );

        ScrollView scroll =
            new ScrollView(this);

        scroll.addView(root);

        setContentView(scroll);

${code}
    }

    private void loadImage(
        ImageView imageView,
        String url
    ) {

        if (
            url == null ||
            url.trim().isEmpty()
        ) {
            return;
        }

        executor.execute(() -> {

            try {

                URL imageUrl =
                    new URL(url);

                HttpURLConnection connection =
                    (HttpURLConnection)
                    imageUrl.openConnection();

                connection.setConnectTimeout(
                    15000
                );

                connection.setReadTimeout(
                    15000
                );

                connection.setDoInput(true);

                connection.connect();

                InputStream input =
                    connection.getInputStream();

                Bitmap bitmap =
                    BitmapFactory.decodeStream(
                        input
                    );

                input.close();

                connection.disconnect();

                runOnUiThread(() -> {

                    if (bitmap != null) {

                        imageView.setImageBitmap(
                            bitmap
                        );

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

module.exports = {
  generateAndroidProject
};
