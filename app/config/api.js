// The deployed backend (see ../render.yaml, service "vidyasetu-backend").
// This is the default so the app works out of the box on a real device —
// "localhost" only ever means the phone itself, never a dev machine, and
// which LAN-IP/10.0.2.2 alias is correct depends on device vs. emulator, so
// there's no locally-correct default that works for everyone.
const DEPLOYED_API_URL = "https://vidyasetu-backend.onrender.com/api/v1";

// Point at a backend running on your own machine during local development
// (e.g. a forwarded/tunnelled port) — set in .env, must include /api/v1:
//   EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000/api/v1        (physical device)
//   EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1             (Android emulator)
//   EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1            (iOS simulator)
//   EXPO_PUBLIC_API_URL=https://your-tunnel-host/api/v1         (forwarded/public tunnel)
//
// A trailing slash here (e.g. ".../api/v1/") would double up with the leading
// slash on every endpoint path in api/*.js and 404 against the backend — strip
// it defensively rather than requiring everyone to get .env formatting exactly right.
// EXPO_PUBLIC_* vars are inlined into the JS bundle at build/bundle time, not
// read live — changing .env always needs a full restart (`expo start -c`) and,
// for a native dev-client build, a rebuild (`expo run:android`/`run:ios`) to take effect.
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEPLOYED_API_URL).replace(/\/+$/, "");
