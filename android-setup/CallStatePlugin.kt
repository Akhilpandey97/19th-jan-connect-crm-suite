// android/app/src/main/java/app/lovable/callflow/CallStatePlugin.kt
package app.lovable.callflow

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission

/**
 * CallStatePlugin monitors telephony call state and notifies JavaScript listeners
 * with callStarted and callEnded events including phone number and direction.
 * 
 * Usage:
 * 1. Copy this file to: android/app/src/main/java/<your/package>/CallStatePlugin.kt
 * 2. Update the package name above to match your app's package
 * 3. Register in MainActivity.kt:
 *    override fun onCreate(savedInstanceState: Bundle?) {
 *        registerPlugin(CallStatePlugin::class.java)
 *        super.onCreate(savedInstanceState)
 *    }
 * 4. Add permissions to AndroidManifest.xml:
 *    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
 *    <uses-permission android:name="android.permission.READ_CALL_LOG" />
 */
@CapacitorPlugin(
    name = "CallStatePlugin",
    permissions = [
        Permission(
            alias = "phoneState",
            strings = [
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.READ_CALL_LOG
            ]
        )
    ]
)
class CallStatePlugin : Plugin() {

    private var callReceiver: BroadcastReceiver? = null
    private var lastCallState = TelephonyManager.CALL_STATE_IDLE
    private var currentPhoneNumber: String? = null

    override fun load() {
        super.load()
        if (hasPhoneStatePermission()) {
            registerCallStateReceiver()
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        unregisterCallStateReceiver()
    }

    private fun hasPhoneStatePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun registerCallStateReceiver() {
        if (callReceiver != null) {
            return // Already registered
        }

        callReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
                    return
                }

                val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
                val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

                when (state) {
                    TelephonyManager.EXTRA_STATE_RINGING -> {
                        // Incoming call ringing
                        currentPhoneNumber = incomingNumber
                        notifyCallStarted(incomingNumber ?: "Unknown", "incoming")
                        lastCallState = TelephonyManager.CALL_STATE_RINGING
                    }
                    TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                        // Call answered (either incoming or outgoing)
                        if (lastCallState == TelephonyManager.CALL_STATE_IDLE) {
                            // Outgoing call detected
                            // LIMITATION: Getting outgoing number is restricted on Android 9+
                            // The incomingNumber field will be null for outgoing calls.
                            // To get the actual number, you would need:
                            // 1. PROCESS_OUTGOING_CALLS permission (deprecated in Android 10+)
                            // 2. Or fetch from call log after the call using READ_CALL_LOG permission
                            // For now, we mark it as "Unknown" and the hook will try to match from call log
                            currentPhoneNumber = incomingNumber ?: "Unknown"
                            notifyCallStarted(currentPhoneNumber ?: "Unknown", "outgoing")
                        }
                        lastCallState = TelephonyManager.CALL_STATE_OFFHOOK
                    }
                    TelephonyManager.EXTRA_STATE_IDLE -> {
                        // Call ended
                        if (lastCallState != TelephonyManager.CALL_STATE_IDLE) {
                            notifyCallEnded(currentPhoneNumber ?: "Unknown")
                            currentPhoneNumber = null
                        }
                        lastCallState = TelephonyManager.CALL_STATE_IDLE
                    }
                }
            }
        }

        val filter = IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
        context.registerReceiver(callReceiver, filter)
    }

    private fun unregisterCallStateReceiver() {
        callReceiver?.let {
            try {
                context.unregisterReceiver(it)
            } catch (e: Exception) {
                // Receiver was not registered or already unregistered
            }
            callReceiver = null
        }
    }

    private fun notifyCallStarted(phone: String, direction: String) {
        val ret = JSObject()
        ret.put("phone", phone)
        ret.put("direction", direction)
        notifyListeners("callStarted", ret)
    }

    private fun notifyCallEnded(phone: String) {
        val ret = JSObject()
        ret.put("phone", phone)
        notifyListeners("callEnded", ret)
    }

    /**
     * Optional: Request permissions from JavaScript
     * Note: Permissions are auto-requested when needed on Android
     */
    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        if (!hasPhoneStatePermission()) {
            requestPermissionForAlias("phoneState", call, "phoneStatePermsCallback")
        } else {
            call.resolve()
        }
    }
}
