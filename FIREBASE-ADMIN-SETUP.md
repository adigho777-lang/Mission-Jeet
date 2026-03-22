# 🔥 Firebase Admin SDK Setup Guide

To send push notifications, you need to set up Firebase Admin SDK with service account credentials.

## Step 1: Get Service Account Key from Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mission-jeet-8f2f5**
3. Click the ⚙️ gear icon → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** (downloads a JSON file)

The JSON file looks like this:
```json
{
  "type": "service_account",
  "project_id": "mission-jeet-8f2f5",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@mission-jeet-8f2f5.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Step 2: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these 3 variables:

### Variable 1: FIREBASE_PROJECT_ID
- **Name**: `FIREBASE_PROJECT_ID`
- **Value**: `mission-jeet-8f2f5`
- **Environment**: Production, Preview, Development (select all)

### Variable 2: FIREBASE_CLIENT_EMAIL
- **Name**: `FIREBASE_CLIENT_EMAIL`
- **Value**: Copy the `client_email` from the JSON file
  - Example: `firebase-adminsdk-xxxxx@mission-jeet-8f2f5.iam.gserviceaccount.com`
- **Environment**: Production, Preview, Development (select all)

### Variable 3: FIREBASE_PRIVATE_KEY
- **Name**: `FIREBASE_PRIVATE_KEY`
- **Value**: Copy the ENTIRE `private_key` from the JSON file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- **Environment**: Production, Preview, Development (select all)

**IMPORTANT**: The private key must include the newlines. Copy it exactly as shown in the JSON file.

## Step 3: Redeploy

After adding environment variables:
1. Go to **Deployments** tab in Vercel
2. Click the ⋯ menu on the latest deployment
3. Click **Redeploy**
4. Or just push a new commit to trigger deployment

## Step 4: Test Notifications

1. Login to your site
2. Click the bell icon to enable notifications
3. Go to admin panel → Notifications tab
4. Send a test notification
5. You should receive it even if browser is closed!

## Troubleshooting

### "Firebase Admin not configured" error
- Make sure all 3 environment variables are set in Vercel
- Redeploy after adding variables
- Check variable names are EXACTLY as shown (case-sensitive)

### "Invalid private key" error
- Make sure you copied the ENTIRE private key including:
  - `-----BEGIN PRIVATE KEY-----`
  - All the content
  - `-----END PRIVATE KEY-----`
- The key should have `\n` characters for newlines

### Still not working?
- Check Vercel function logs for error messages
- Make sure Firebase project ID matches your actual project
- Verify the service account has "Firebase Cloud Messaging Admin" role

## Security Notes

- **NEVER commit the service account JSON file to Git**
- **NEVER share your private key publicly**
- Environment variables in Vercel are encrypted and secure
- Only server-side code can access these variables (not exposed to browser)

## Alternative: Test Without Admin SDK

If you just want to test the frontend (token saving, permission requests), you can skip this setup. The backend API will return an error, but the frontend will still work and save tokens to Firestore.

For production, you MUST set up Firebase Admin SDK to actually send notifications.
