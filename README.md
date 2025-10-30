# Zapdesk — Zendesk Lightning Tips

A Zendesk (ZAF v2) sidebar app that lets **end-users tip agents** with Bitcoin Lightning.

- **Wallet-agnostic**: **QR (BOLT11/LNURL-pay)** payment methods.
- **End-user message**: user can add a short “thank you” with their tip.
- **Ticket posting**: app auto-posts that the agent was tipped (public or internal, configurable).

![847b3c6c-7894-4c53-a2b3-486cc8b88b83](https://github.com/user-attachments/assets/9bc94d6b-ebea-44bf-a098-03c274e91c1f)

> Built as a packaged React app (Zendesk React scaffold baseline).  
> No backend required.

---

## Features

- 🧾 **QR / Invoice** — Generate and display **BOLT11** or **LNURL-pay** target + QR.
- 💬 **User message** — free-text input appended to the ticket comment.
- 📨 **Ticket update** — after a successful tip, Zapdesk posts a message (public/internal).
- ⚙️ **Admin settings** — tip presets, agent address field key, post visibility.
- 🌍 **Multi-language support** — Automatically detects and uses the Zendesk user's language preference (English, Spanish).

---

## Architecture

- ZAF v2 **iframe app** (React, Vite, Garden), served from `/assets`.
- **Payout target**: agent Lightning Address from a Zendesk user field (configurable).
- **Payment flows**
  - **QR/LNURL-pay**: show QR + copyable string.

---

## Install (dev)

Prereqs: Node 18+, ZCLI (`npm i -g @zendesk/zcli`), Zendesk dev/sandbox.

```bash
git clone https://github.com/KnowAll-AI/zendesk-zapdesk
cd zendesk-zapdesk
npm i
zcli apps:server
```

Open your Zendesk sandbox → Admin → Apps → Manage → Development → Load app from localhost.

## Build & Package

```
npm run build          # emits /assets (iframe.html, app.js, app.css)
zcli apps:package      # produces distributable .zip
```

Upload the zip in Admin Center → Apps and integrations → Zendesk Support apps → Upload app.

## Automated Releases

This project uses GitHub Actions for CI/CD:

**Continuous Integration & Release (CI)**
- Runs on every push to `main` and on all pull requests
- Builds the application automatically
- Uploads build artifacts for verification
- **On push to `main`**: Creates a GitHub release with `zapdesk-{version}.zip`

**Creating a New Release:**

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Commit and push to main
git add package.json
git commit -m "Bump version to x.x.x"
git push origin main
```

The workflow will automatically:
1. Build the application
2. Create `zapdesk-{version}.zip` package
3. Publish a GitHub release with the zip file

## Configure (App settings)

- Tip presets: e.g. `100,1000,10000`
- Enable modes:
  - `showQrMode` (QR/LNURL)
- Agent address field key: e.g. `user.custom_fields.lightning_address`
- Fallback address (optional)
- Ticket post visibility: `public` or `internal`
- Branding (optional): title/description

## Usage (end-user flow)

- Open ticket → Zapdesk shows presets and a message box (optional).
- Choose QR (scan/copy) to tip.
  - On success: The app posts to the ticket (public/internal as configured).
- Agent receives funds to their Lightning Address.

## Security

- Iframe sandbox (ZAF v2). No custody; end-user's wallet makes the payment.
- No WebLN.

## Multi-Language Support

Zapdesk automatically detects and displays content in the user's preferred language based on their Zendesk profile settings.

### Supported Languages

- 🇬🇧 **English** (`en`) - Default language
- 🇪🇸 **Spanish** (`es`) - Full translation available

### How It Works

1. **Automatic Detection**: When the app loads, it fetches the current user's locale from Zendesk via `currentUser.locale`
2. **Smart Fallback**: If a user's specific locale variant isn't available (e.g., `es-MX`), the app falls back to the base language (`es`)
3. **Default Language**: If the detected language isn't supported, the app defaults to English

### Changing Your Language

To see the app in a different language:

1. **In Zendesk**, click on your profile picture (top right)
2. Click **"View profile"** or **"My profile"**
3. Click **"Edit profile"**
4. Find the **"Language"** dropdown
5. Select your preferred language (e.g., **"Español"** for Spanish)
6. Click **"Save"** or **"Update"**
7. Reload any ticket page - the Zapdesk app will now display in your selected language

**Important**: The app uses your **Zendesk user profile language**, not your browser language settings.

### Technical Details

- Translation files: `translations/en.json` and `translations/es.json`
- The app uses a custom i18n system that supports nested translation keys
- Console logs show which locale is detected: `[Zapdesk] User locale: es`

### Adding More Languages

To add support for additional languages:

1. Create a new translation file in `translations/` (e.g., `fr.json` for French)
2. Copy the structure from `en.json` and translate all values
3. Add the locale code to `manifest.json` under `supportedLocales`
4. The app will automatically detect and use the new language

## Prerequisite: Custom Field

- Add custom field
  - Go to [https://{subdomain}.zendesk.com/admin/people/configuration/user_fields](https://{subdomain}.zendesk.com/admin/people/configuration/user_fields)
  - Click on **Add field**
  - Enter the following:
    - **Type**: `text`
    - **Name**: `lightning address`
    - **Field key**: `lightning_address` (exactly)
- Go to [https://{subdomain}.zendesk.com/admin/people/team/members](https://{subdomain}.zendesk.com/admin/people/team/members)
  - In member table click on manage in support
  - On manage in support page, scroll to bottom you will see previously added `lightning_address` field, enter the lightning address (looks like an email) for the user.
- Now go to ticket you can see Zapdesk App on the right sidebar, click on it, and it will show the app.


## License

MIT
