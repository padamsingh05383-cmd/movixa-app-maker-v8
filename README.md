# Movixa App Maker V8 — Real Android Build Server

V8 packages a reproducible Linux build-server image.

It installs:
- OpenJDK 17
- Android command-line tools
- Android SDK Platform 35
- Android Build Tools 35.0.0
- Gradle 8.9
- Movixa V7 build API

The generated Android project uses Android Gradle Plugin 8.7.3. Google's compatibility table lists Gradle 8.9 as the required Gradle version for AGP 8.7. citeturn0search2

Google currently provides Android command-line tools for Linux and the SDK can be managed from command-line tools. citeturn0search4turn0search6

## Run

From this folder:

```bash
docker build -t movixa-builder-v8 .
docker run --rm -p 8080:8080 movixa-builder-v8
```

Then open:

http://localhost:8080

## Build flow

Create/design project -> choose APK/AAB -> Build -> server generates Android project -> Gradle compiles -> artifact becomes downloadable.

## Production security

This is a build-server foundation, not a public multi-tenant service yet.
Before exposing it publicly:
- add authentication and per-user project authorization,
- isolate each build,
- limit CPU/RAM/time,
- rate-limit builds,
- validate uploaded project data,
- keep signing keys outside the image,
- use HTTPS,
- store artifacts in private object storage,
- never place cloud credentials or keystores in browser code.

Unsigned/debug APK generation is suitable for testing. Play Store AAB publishing requires a release signing setup and Play Console workflow.
