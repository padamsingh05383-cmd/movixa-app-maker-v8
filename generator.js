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

function w(f, c) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, c);
}

function generateAndroidProject(p, d) {

  const n = safe(p.name);
  const ns = "com.movixa.generated." + n.toLowerCase();
  const cs = Array.isArray(p.components) ? p.components : [];

  const views = cs.map((c, i) => {
    const id = "movixa_" + i;

    if (c.type === "button") {
      return `<Button android:id="@+id/${id}" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="${xml(c.text || "Button")}" />`;
    }

    if (c.type === "image") {
      return `<ImageView android:id="@+id/${id}" android:layout_width="match_parent" android:layout_height="180dp" android:contentDescription="Image" android:scaleType="centerCrop" />`;
    }

    if (c.type === "video") {
      return `<VideoView android:id="@+id/${id}" android:layout_width="match_parent" android:layout_height="220dp" />`;
    }

    if (c.type === "url" || c.type === "webview") {
      return `<WebView android:id="@+id/${id}" android:layout_width="match_parent" android:layout_height="300dp" />`;
    }

    return `<TextView android:id="@+id/${id}" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="${xml(c.text || "Text")}" android:textSize="18sp" android:padding="12dp" />`;

  }).map(x => "        " + x).join("\n");

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
`android.useAndroidX=true
android.nonTransitiveRClass=true
org.gradle.daemon=false
org.gradle.jvmargs=-Xmx256m -XX:MaxMetaspaceSize=128m -Dfile.encoding=UTF-8
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
        android:label="${xml(p.name || "Movixa App")}">

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

${views || `        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Built with Movixa App Maker"/>`}

    </LinearLayout>

</ScrollView>`
  );

  w(
    path.join(d, "app/src/main/res/values/styles.xml"),
`<resources>
    <style name="AppTheme" parent="android:style/Theme.Material.Light.NoActionBar"/>
</resources>`
  );

  w(
    path.join(d, "app/src/main/java", ...ns.split("."), "MainActivity.java"),
`package ${ns};

import android.app.Activity;
import android.os.Bundle;

public class MainActivity extends Activity {

    @Override
    public void onCreate(Bundle b) {
        super.onCreate(b);
        setContentView(R.layout.activity_main);
    }
}`
  );
}

module.exports = { generateAndroidProject };
