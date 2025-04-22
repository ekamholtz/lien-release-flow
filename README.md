# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b29851fb-2980-44fc-a8f0-8414e28c7c82

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b29851fb-2980-44fc-a8f0-8414e28c7c82) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b29851fb-2980-44fc-a8f0-8414e28c7c82) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Connect QuickBooks (sandbox test)

**Phase 1–2 manual test checklist**
1. Run the migration:  
   `psql $DATABASE_URL < supabase/migrations/20250410_qbo_integration.sql`
2. Deploy edge functions:  
   `supabase functions deploy qbo-authorize`  
   `supabase functions deploy qbo-callback`
3. Set required env vars in the dashboard or `.env`:
   - INTUIT_CLIENT_ID
   - INTUIT_CLIENT_SECRET
   - QBO_REDIRECT_URI (match your Supabase endpoint!)
   - INTUIT_ENVIRONMENT (`sandbox`)
4. In the app UI, go to Integrations:
   - See “Not Connected” status.
   - Click “Connect QuickBooks” – should redirect to Intuit OAuth sandbox.
   - After successful authentication, should land back on /integrations with “Connected” status.
5. Inspect tables (qbo_connections, qbo_logs) and Supabase logs for upserted token and log rows.
6. Try revoking QBO access in the sandbox and repeat.

See [Intuit sandbox docs](https://developer.intuit.com/app/developer/qbo/docs/develop/sandbox-test-accounts).
