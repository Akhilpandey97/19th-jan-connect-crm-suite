package app.lovable.callflow

import android.content.Context
import android.telephony.PhoneStateListener
import android.telephony.TelephonyManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission

@CapacitorPlugin(name = "CallStatePlugin")
class CallStatePlugin : Plugin() {
    private var telephonyManager: TelephonyManager? = null
    private var listener: PhoneStateListener? = null
    private var lastState = TelephonyManager.CALL_STATE_IDLE
    private var incomingNumber: String? = null

    override fun load() {
        telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        listener = object : PhoneStateListener() {
            override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                super.onCallStateChanged(state, phoneNumber)
                try {
                    if (state == TelephonyManager.CALL_STATE_RINGING) {
                        incomingNumber = phoneNumber
                        val data = JSObject()
                        data.put("phone", phoneNumber)
                        data.put("direction", "incoming")
                        notifyListeners("callStarted", data)
                    } else if (state == TelephonyManager.CALL_STATE_OFFHOOK) {
                        val data = JSObject()
                        data.put("phone", phoneNumber ?: incomingNumber)
                        data.put("direction", "unknown")
                        notifyListeners("callStarted", data)
                    } else if (state == TelephonyManager.CALL_STATE_IDLE) {
                        val data = JSObject()
                        data.put("phone", phoneNumber ?: incomingNumber)
                        notifyListeners("callEnded", data)
                        incomingNumber = null
                    }
                } catch (e: Exception) {
                    // swallow exceptions
                }
            }
        }
        telephonyManager?.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
    }

    override fun handleOnDestroy() {
        telephonyManager?.listen(listener, PhoneStateListener.LISTEN_NONE)
    }

    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        call.resolve()
    }
}