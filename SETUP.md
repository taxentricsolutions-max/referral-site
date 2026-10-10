# Referral program update — setup steps

Do these in order. The new pages need the new script, so update the script first.

## 1. Update the Apps Script (about 10 minutes)

1. Open the referral Google Sheet → **Extensions → Apps Script** (use a private window if you get the "unable to open the file" error).
2. Select everything in `Code.gs`, delete it, and paste in the new `Code.gs`. Click **Save**.
3. Click the **gear icon (Project Settings)** → scroll to **Script Properties** → **Add script property**:
   - Property: `RECAPTCHA_SECRET`
   - Value: your reCAPTCHA secret key
   Click **Save script properties**.
4. In the function dropdown at the top, choose `testSetup` and click **Run**. Approve permissions if asked. Under **Execution log** you should see `Secret key set: true`.
5. **Deploy the new version. This step is what makes the changes go live.**
   **Deploy → Manage deployments** → click the pencil (Edit) on your existing web app deployment → **Version: New version** → **Deploy**.
   Keep "Execute as: Me" and "Who has access: Anyone".
   Do not use "New deployment"; that creates a different web address. If you did, paste the new address into `SCRIPT_URL` in `config.js`.

## 2. Check reCAPTCHA domains

At https://www.google.com/recaptcha/admin, open your site key → Settings → make sure `referrals.taxentric.com` is listed under Domains.

## 3. Upload the website files to GitHub

In github.com/taxentricsolutions-max/referral-site:

1. **Add file → Upload files**, drag in every file from the `referral-site` folder, then **Commit changes**. Files with the same name are replaced.
2. Delete these old files (open each one → ⋯ menu → **Delete file** → Commit):
   - `background.png`, `dashboard background.png`, `dashboard logo.png`
   - `Studio-Project (21).png`, `Taxentric Sun IV.png`
   - `tracker.html`, `tracker.js`, `dashboard-style.css`, `sms-fallback.html`
   - `referralmessage.png` (the old "$25 off" share image)

The site updates within a few minutes.

## 4. The Google Sheet

- **Referrals tab**: unchanged layout (columns A–H), so Zapier and your formulas keep working. Same email signing up twice now returns the existing code instead of creating a new row.
- **Client Signups tab**: the script matches existing column headers and adds any missing ones on the right: Referred By, Client Email, Phone, Service, Reward Amount, Reward Status.
- **Reward Status**: new friend signups come in as `Pending`. Change it to `Qualified` when the return is filed / plan starts, and to `Paid` once you've paid the referrer. The dashboard totals rewards from this column.
- **Blocked tab**: created automatically. Every rejected submission is logged with the reason so you can see what's being stopped.

## 5. Test

1. Go to referrals.taxentric.com, sign up with your own name and email. You should get a link and the Zapier email.
2. Open that link in a private window, choose a service and submit. Check the Client Signups tab.
3. Open your dashboard link.

## Adjusting later

All in `CONFIG` at the top of `Code.gs` (redeploy a new version after any change):
- `MIN_SCORE`: raise to 0.7 if spam still gets through; lower to 0.3 if real people get blocked (check the Blocked tab).
- `SERVICES`: reward amounts.

On the website, reward amounts and the friend discount are in `config.js` and in the page text.
