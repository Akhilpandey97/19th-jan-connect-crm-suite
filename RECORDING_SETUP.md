# Auto-Call Recording Setup Guide

This guide explains how to set up and configure the auto-call recording feature in the Connect CRM Suite.

## Overview

The auto-call recording feature automatically records phone calls made through the Android app, uploads them to Supabase Storage, and attaches them to lead activities. It also supports manual recording in the lead activity form.

## Features

- ✅ **Automatic Call Recording**: Records calls automatically when made through the Android app
- ✅ **Manual Recording**: Record calls manually in the lead activity form
- ✅ **Supabase Integration**: Uploads recordings to Supabase Storage
- ✅ **Lead Matching**: Automatically matches calls to leads based on phone number
- ✅ **Audio Playback**: Play recordings directly in the activity list
- ✅ **Security**: URL validation and proper error handling

## Prerequisites

1. Android device (real device required - emulator not supported for telephony)
2. Supabase project with storage bucket configured
3. Android Studio for building the native app

## Supabase Setup

### 1. Create Storage Bucket

1. Log in to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `recordings`
4. Configure bucket access:
   - **Public Bucket** (easier setup): Enable public access
   - **Private Bucket** (recommended for production): Keep private and implement signed URLs

### 2. Set Storage Permissions

For public bucket:
```sql
-- Allow authenticated users to upload recordings
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recordings');

-- Allow public access to read recordings
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recordings');
```

For private bucket (requires signed URL implementation):
```sql
-- Allow authenticated users to upload recordings
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recordings');

-- Allow authenticated users to read their own recordings
CREATE POLICY "Allow authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'recordings');
```

## Android Setup

### 1. Copy Native Plugin

Copy the CallStatePlugin to your Android project:

```bash
cp android-setup/CallStatePlugin.kt android/app/src/main/java/app/lovable/callflow/
```

**Important**: Update the package name in `CallStatePlugin.kt` to match your app's package.

### 2. Register Plugins in MainActivity

Edit `android/app/src/main/java/app/lovable/callflow/MainActivity.kt`:

```kotlin
package app.lovable.callflow // Update to your package

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register plugins BEFORE calling super.onCreate()
        registerPlugin(CallStatePlugin::class.java)
        registerPlugin(AudioRecorderPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

### 3. Add Permissions to AndroidManifest.xml

Add these permissions to `android/app/src/main/AndroidManifest.xml` (before `<application>` tag):

```xml
<!-- Call State Monitoring -->
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.READ_CALL_LOG" />

<!-- Audio Recording -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Optional: For foreground service if needed -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### 4. Sync and Build

```bash
npx cap sync android
npx cap open android
```

Build and run on a real Android device.

## Usage

### Enabling Auto-Recording

⚠️ **IMPORTANT**: Auto-recording is disabled by default for privacy and legal compliance.

To enable auto-recording in your app, you need to:

1. Implement a user consent flow
2. Update privacy policy
3. Add a toggle in settings to enable/disable auto-recording

Example usage in a settings component:

```tsx
import { useAutoCallRecorder } from '@/hooks/useAutoCallRecorder';

function SettingsPanel() {
  const { isEnabled, setIsEnabled } = useAutoCallRecorder();
  
  return (
    <div>
      <Switch
        checked={isEnabled}
        onCheckedChange={setIsEnabled}
      />
      <label>Enable Auto-Recording</label>
    </div>
  );
}
```

### Manual Recording

Manual recording is available in the Lead Detail Sheet:

1. Open a lead
2. Click "Add Activity"
3. Select "Call" type
4. Click "Record" button
5. Click "Stop" when done
6. Fill in activity details and click "Add"

The recording will be uploaded and attached to the activity.

### Playback

Recordings appear in the activity list with an audio player. Click play to listen to the recording.

## Testing

### Testing Checklist

- [ ] **Permissions**: Verify all permissions are granted on device
- [ ] **Auto-Recording**:
  - [ ] Make an outgoing call
  - [ ] Receive an incoming call
  - [ ] Verify recordings appear in Supabase Storage
  - [ ] Verify activities are created with recording metadata
  - [ ] Check lead matching works correctly
- [ ] **Manual Recording**:
  - [ ] Record a call manually in lead activity form
  - [ ] Verify upload to Supabase
  - [ ] Verify activity is created with recording
- [ ] **Playback**:
  - [ ] Play recording from activity list
  - [ ] Verify audio quality
  - [ ] Test on different devices

### Debug Logs

To view debug logs:

```bash
# Android Studio Logcat, filter by "CallStatePlugin"
adb logcat | grep CallStatePlugin
```

## Known Limitations

### 1. Android 10+ Audio Capture
Android 10 and later restrict call audio capture. The app may only record from the microphone, not both sides of the conversation.

**Workaround**: Use devices with Android 9 or earlier for two-way recording.

### 2. Outgoing Call Numbers
On Android 9+, the system restricts access to outgoing call numbers. Outgoing calls will show as "Unknown" in the recording.

**Workaround**: Implement call log integration to fetch the number after the call ends.

### 3. Phone Number Matching
The system uses a simple phone number matching algorithm. International numbers may not match correctly.

**Future Improvement**: Implement a phone number normalization library like libphonenumber.

### 4. Upload Reliability
Uploads are synchronous and may fail if the app goes to background or network is lost.

**Future Improvement**: Implement background upload with WorkManager for retry logic.

## Security & Privacy Considerations

### Legal Requirements

⚠️ **CRITICAL**: Before enabling auto-recording in production:

1. **Obtain User Consent**: Implement explicit opt-in consent flow
2. **Update Privacy Policy**: Disclose recording practices, storage, and retention
3. **Verify Legal Compliance**: Check recording laws in your target jurisdictions
4. **Data Retention**: Define and implement retention policy
5. **Access Controls**: Consider private bucket with signed URLs

Many jurisdictions require:
- Two-party consent for call recording
- Clear disclosure before recording
- Ability for users to opt-out
- Secure storage and limited retention

**Recommendation**: Consult with legal counsel before enabling auto-recording.

### Security Best Practices

1. ✅ **URL Validation**: Recordings are validated to ensure they're from Supabase
2. ✅ **SQL Injection Protection**: Query parameters are properly escaped
3. ✅ **Error Handling**: Detailed error messages for debugging
4. ✅ **Type Safety**: Proper TypeScript types for all data structures

## Troubleshooting

### Recording Not Starting

1. Check permissions are granted on device
2. Verify plugin is registered in MainActivity
3. Check Logcat for errors
4. Ensure running on real device (not emulator)

### Upload Failing

1. Check Supabase bucket exists and is named `recordings`
2. Verify storage permissions in Supabase
3. Check network connectivity
4. Review error messages in toast notifications

### Lead Matching Not Working

1. Verify phone numbers in leads table match format
2. Check call log for actual phone number
3. Review normalization logic in useAutoCallRecorder

### Audio Playback Not Working

1. Verify recording URL is valid in database
2. Check browser console for CORS errors
3. Ensure Supabase bucket has public read access (or use signed URLs)

## Future Enhancements

Planned improvements:

- [ ] User consent flow and settings toggle
- [ ] International phone number normalization
- [ ] Background upload with WorkManager
- [ ] Private bucket with signed URLs
- [ ] Call log integration for outgoing numbers
- [ ] Retry logic for failed uploads
- [ ] Recording deletion/cleanup workflow
- [ ] Analytics and usage tracking

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the code in `src/hooks/useAutoCallRecorder.ts`
3. Check Android logs with `adb logcat`
4. Open an issue on GitHub with:
   - Device model and Android version
   - Error messages and logs
   - Steps to reproduce

## License

Part of the Connect CRM Suite project.
