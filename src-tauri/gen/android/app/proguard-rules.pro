# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Keep Tauri and Rust JNI bindings
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-dontwarn app.tauri.**
-keep class app.tauri.** { *; }
-keep class com.jrad.neuroloop.** { *; }