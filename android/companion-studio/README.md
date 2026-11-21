# Companion Studio Android

Install `CompanionStudio.apk` from the Companion Studio Android APK GitHub Actions artifact. On Android, allow the app you downloaded it from to install unknown apps if prompted. Launch **Companion Studio** and sign in with the existing developer Google account. The APK opens the hosted editor in a browser-backed window, preserving its developer authorization and browser-based uploads, downloads and local drafts. It does not contain or launch the game. Internet access and a modern Android browser are required.

This sideload build uses a new development signing key each time. Android will not accept a differently signed build as an in-place upgrade; export any drafts first before uninstalling a prior build. For repeatable upgrades, establish a separately secured production signing key first. No developer credentials are stored in the APK.
