# KumbuFlow: Your Business, Under Control

Transform the existing project into KumbuFlow, a modern, independent SaaS application for small businesses in Angola. If the current project is named Kumbu Diário, rename the application, interface, metadata, and branding to KumbuFlow without unnecessarily rebuilding working components.

Use the official KumbuFlow brand identity: a modern geometric K symbol combined with a blue upward-flowing arrow, the wordmark “KumbuFlow” in dark navy and bright blue, and the tagline “O teu negócio, sob controlo.” Use #087BFF, #071A35, and #FFFFFF consistently. Apply the identity to the login screen, dashboard, navigation, favicon, and mobile layouts. Keep the design clean, professional, and consistent with the official logo. @connector:github:"GitHub API" 



Language and design



- All user-facing text in Angolan Portuguese.

- Currency: Kz (AOA); dates: DD/MM/YYYY; timezone: Africa/Luanda.

- Modern, professional, mobile-first design with responsive dashboards, simple navigation, clear charts, and accessible forms.



Technology

Use React, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL, RLS, Supabase Storage, and Edge Functions. Preserve the existing project structure where practical. Synchronize source code and database migrations with GitHub. Prepare documented deployment to Lovable or Vercel.



Authentication and onboarding

Implement email/password registration, login, logout, password recovery, protected routes, profile management, and business onboarding. Users must only access their own authorized business data.



Business management

Implement functional modules for:



1. Dashboard: sales, income, expenses, profit estimates, cash flow, debts, low stock, and recent transactions.

2. Sales: products, quantities, prices, discounts, customers, payment methods, partial payments, credit sales, receipts, and controlled reversals.

3. Products and inventory: product catalogue, costs, prices, stock movements, restocking, stock alerts, and safe inventory updates.

4. Expenses: categories, amounts, dates, notes, and private receipt attachments.

5. Customers: contact information, purchase history, balances, and outstanding debts.

6. Customer debts: due dates, partial payments, balances, payment history, and auditable corrections.

7. Suppliers and purchases: supplier records, stock purchases, and optional outstanding balances.

8. Reports: daily/monthly sales, expenses, cash flow, customer debts, inventory, and available profit calculations, with date filters and CSV export.



Use real database records, accurate calculations, proper transaction handling, and useful loading, error, and empty states. Do not use hardcoded data as real results.



Subscriptions

Plans: 1,500 Kz for 30 days, 3,500 Kz for 90 days, and a seven-day free trial. Start the trial using a server timestamp. Implement secure expiry, renewal, and access restrictions while preserving customer data. Never trust client-side subscription status.



Payments

Initially support manual bank transfer only. Customers select a plan, see administrator-configured bank details, submit a payment reference and optional receipt, and wait for review. Keep payment requests pending until an authorized administrator independently verifies the transfer.



Create an admin dashboard to review, approve, or reject payments, configure bank details, manage plans, view subscriptions, and inspect audit logs. Leave bank details empty until configured. Never invent banking information or activate subscriptions from screenshots alone.



Store receipts in private Supabase Storage. Implement secure server-side approval and rejection operations, audit events, and duplicate-approval protection.



Prepare a disabled payment-provider interface for a future MULTICAIXA integration. Do not invent APIs, credentials, or gateway capabilities. Enable integration only after obtaining verified official documentation, merchant authorization, and real credentials.



Database and security

Create or adapt tables for profiles, businesses, products, inventory movements, customers, suppliers, sales, sale items, expenses, receivables, payments, subscriptions, payment requests, payment settings, notifications, administrators, and audit logs.



Enable RLS on every sensitive table. Enforce business ownership, server-side authorization, validated inputs, and least-privilege access. Never expose service-role keys or allow users to grant themselves administrator privileges. Use migrations and database constraints. Preserve financial history through controlled reversals rather than silent deletion.



GitHub and deployment

Include a README, environment-variable template without real secrets, database migration instructions, secure administrator setup, Supabase configuration, and Lovable/Vercel deployment instructions. Do not assume GitHub synchronization automatically deploys the application or database functions.



Execution

First inspect the current project and Supabase schema. Implement the application in phases: foundation and security; business modules; subscriptions and manual payments; administration; testing and deployment preparation. Preserve working functionality and fix errors as you proceed.



Test authentication, RLS isolation, sales, inventory, debts, subscription expiry, payment approval, duplicate submissions, and private receipt access. Report what is implemented, what has been tested, and what still requires configuration. Never claim deployment or integration success without verification.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b29e988c-5c64-43e5-b7dd-908cc94118c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
