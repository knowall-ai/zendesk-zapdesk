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

---

## Installation Instructions for Administrators

### Prerequisites

Before installing Zapdesk, ensure you have:
- **Admin access** to your Zendesk instance
- A **Lightning Address custom field** configured (see instructions below)

### Step 1: Download the Latest Release

1. Navigate to the [Releases page](https://github.com/knowall-ai/zendesk-zapdesk/releases)
2. Find the latest release version
3. Download the `zapdesk-{version}.zip` file (e.g., `zapdesk-1.0.0.zip`)
4. Save the zip file to your computer

### Step 2: Create the Custom Field (First-Time Setup Only)

Before installing the app, you need to create a custom user field for Lightning addresses:

1. Log into your Zendesk instance as an administrator
2. Navigate to **Admin Center** (gear icon in the sidebar)
3. Go to **People** → **Configuration** → **User fields**
   - Or visit: `https://{your-subdomain}.zendesk.com/admin/people/configuration/user_fields`
4. Click **Add field** (top right)
5. Configure the field:
   - **Type**: Select `Text`
   - **Field name**: Enter `lightning address`
   - **Field key**: Enter `lightning_address` (must be exactly this)
   - **Description**: (Optional) "Agent's Bitcoin Lightning address for receiving tips"
   - **Required**: Leave unchecked
6. Click **Save**

### Step 3: Install the Zapdesk App

1. In the **Admin Center**, navigate to **Apps and integrations** → **Apps** → **Zendesk Support apps**
   - Or visit: `https://{your-subdomain}.zendesk.com/admin/apps-integrations/apps/support-apps`
2. Click **Upload private app** (top right)
3. Click **Choose File** and select the `zapdesk-{version}.zip` file you downloaded
4. Click **Upload**
5. Review the app permissions and details
6. Click **Install** to confirm

### Step 4: Configure App Settings

After installation, configure the app settings:

1. On the app installation page, configure the following settings:
   - **Ticket post visibility**: Select `public` or `internal` for tip confirmation comments
2. Click **Install** or **Update** to save settings

### Step 5: Add Lightning Addresses to Agent Profiles

For each agent who should receive tips:

1. Navigate to **Admin Center** → **People** → **Team** → **Team members**
   - Or visit: `https://{your-subdomain}.zendesk.com/admin/people/team/members`
2. Find the agent in the member table
3. Click **Manage in Support**
4. Scroll to the bottom of the profile page
5. Find the **Lightning address** field (created in Step 2)
6. Enter the agent's Lightning address (format: `user@provider.com`)
7. Click **Save**

### Step 6: Verify Installation

1. Open any Zendesk ticket
2. Look for **Zapdesk** in the right sidebar (Apps section)
3. Click on the Zapdesk app icon
4. Verify that:
   - The app loads correctly
   - Tip presets are displayed
   - The agent's Lightning address is detected (if configured)
   - QR codes generate properly

### Troubleshooting

**App doesn't appear in ticket sidebar:**
- Verify the app is installed and enabled in Admin Center → Apps
- Refresh your browser or clear cache
- Check that your browser allows iframes

**"No Lightning address found" error:**
- Ensure the custom field key is exactly `lightning_address`
- Verify the agent has a Lightning address in their profile
- Check the "Agent address field key" setting matches `user.custom_fields.lightning_address`
- Try using the fallback address setting for testing

**QR codes not generating:**
- Verify the "Enable QR Mode" setting is checked
- Check browser console for JavaScript errors
- Ensure the Lightning address is valid

**Tip confirmations not posting to tickets:**
- Verify app has permission to post comments
- Check the "Ticket post visibility" setting
- Review Zendesk audit logs for errors

### Updating Zapdesk

To update to a newer version:

1. Download the new `zapdesk-{version}.zip` from the Releases page
2. Navigate to **Admin Center** → **Apps** → **Zendesk Support apps**
3. Find **Zapdesk** in the installed apps list
4. Click the app name or settings icon
5. Click **Update** or **Upload new version**
6. Select the new zip file
7. Click **Upload** and then **Update**
8. Review any new settings and update as needed

### Uninstalling Zapdesk

1. Navigate to **Admin Center** → **Apps** → **Zendesk Support apps**
2. Find **Zapdesk** in the installed apps list
3. Click the settings icon (gear) next to the app
4. Click **Uninstall**
5. Confirm the uninstallation

**Note**: Uninstalling the app does not remove the Lightning address custom field or any historical ticket comments posted by the app.

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

- Iframe sandbox (ZAF v2). No custody; end-user’s wallet makes the payment.
- No WebLN.

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

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
