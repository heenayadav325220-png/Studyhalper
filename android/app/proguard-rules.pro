# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @interface com.getcapacitor.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep @interface com.google.firebase.** { *; }

# Google AI/GenAI
-keep class com.google.ai.** { *; }
-keep class com.google.genai.** { *; }

# Socket.IO
-keep class io.socket.** { *; }

# Better SQLite3
-keep class com.marginallyuseful.sqlitebiter.** { *; }

# OkHttp (used by HTTP libraries)
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Retrofit (if used)
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }

# Gson (JSON parsing)
-keep class com.google.gson.** { *; }
-keep @com.google.gson.annotations.SerializedName class * { *; }

# Apache Commons
-keep class org.apache.commons.** { *; }

# JavaScript/React Native related
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep Activity classes
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
