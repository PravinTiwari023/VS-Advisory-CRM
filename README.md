# VS Advisory CRM - Meta Ads Google Sheets Integration

A high-performance, responsive CRM web application designed specifically for **VS Advisory**, connected live to your **Meta (Facebook/Instagram) Ads Google Sheets** and **Master CRM Sheet** via **Google Apps Script**.

---

## 🚀 Live Data Columns Configured (1-to-1 Match)

| Google Sheet Header | CRM Display / Feature |
| :--- | :--- |
| `id` | Unique Lead Identifier |
| `created_time` | Lead Date & Time (Formatted) |
| `full_name` | Contact Name & Profile |
| `phone_number` | 1-Click WhatsApp & Direct Phone Call |
| `email` | 1-Click Email Composer |
| `which_configuration_are_you_interested_in?` | Advisory / Project Configuration Tag & Filter |
| `what_is_your_budget?` | Financial Qualification & Budget Tag |
| `lead_status` | Pipeline Stage & Kanban Column |
| `campaign_name` | Campaign Attribution & Multi-Filter |
| `ad_name` | Creative Attribution |
| `platform` | Facebook (`FB`) vs Instagram (`IG`) Badges |
| `form_name` | Meta Lead Form Name |
| `is_organic` | Organic vs Paid Tag |
| `adset_name` | Adset Name |
| `crm_notes` | Advisor consultation notes (Synced to Sheet) |
| `crm_assigned_to` | Assigned team member (Synced to Sheet) |
| `crm_next_follow_up` | Next Follow-up Due Date |

---

## ⚡ Quick Start: Connecting Your Google Sheets (2 Minutes)

### Step 1: Open Google Apps Script
1. Open your Master CRM Google Sheet (or one of your Meta Ads Google Sheets).
2. Click **Extensions** > **Apps Script** in the top menu.

### Step 2: Paste the Backend Script
1. Open `google-apps-script/Code.gs` in this repository (or copy it directly from the CRM in-app **Google Sheet Setup** tab).
2. Replace all code in Apps Script with the script.

### Step 3: Deploy as Web App
1. In Apps Script, click **Deploy** > **New deployment**.
2. Select type: **Web app**.
3. Set **Execute as**: `Me`.
4. Set **Who has access**: `Anyone` *(Required so your CRM can fetch and save leads)*.
5. Click **Deploy**, copy the generated **Web App URL**.

### Step 4: Link in CRM
1. Start the CRM with `npm run dev`.
2. Go to the **Google Sheet Setup** tab.
3. Paste your Web App URL and your Spreadsheet IDs.
4. Click **Test & Verify Connection** and then click **Verify Sheet Tabs** to initialize team users, activities, and tasks!

---

## 🖥️ Local Development Commands

```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
