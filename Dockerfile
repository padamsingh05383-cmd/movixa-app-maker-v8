FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV GRADLE_HOME=/opt/gradle
ENV PATH=/opt/gradle/bin:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk curl unzip ca-certificates git nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Google Android command-line tools (current Linux package listed by Android Developers).
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    curl -fsSL -o /tmp/cmdline-tools.zip \
    https://dl.google.com/android/repository/commandlinetools-linux-15859902_latest.zip && \
    unzip -q /tmp/cmdline-tools.zip -d /tmp/android-tools && \
    mv /tmp/android-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
    rm -rf /tmp/cmdline-tools.zip /tmp/android-tools

RUN yes | sdkmanager --licenses >/dev/null || true && \
    sdkmanager \
      "platform-tools" \
      "platforms;android-35" \
      "build-tools;35.0.0"

# AGP 8.7 is paired with Gradle 8.9.
RUN curl -fsSL -o /tmp/gradle.zip \
    https://services.gradle.org/distributions/gradle-8.9-bin.zip && \
    unzip -q /tmp/gradle.zip -d /opt && \
    ln -s /opt/gradle-8.9 ${GRADLE_HOME} && \
    rm /tmp/gradle.zip

WORKDIR /app
COPY server/package.json ./package.json
RUN npm install --omit=dev
COPY server/ ./

RUN mkdir -p jobs workspace artifacts public
EXPOSE 8080

ENV PORT=8080
ENV BUILD_COMMAND=gradle assembleDebug

CMD ["node","server.js"]
