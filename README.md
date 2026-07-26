This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Hifadhi — environment

`.env` (not committed):

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | yes | Claude vision extraction + form field mapping |
| `ENCRYPTION_KEY` | yes | AES-256-GCM key for documents at rest |
| `SESSION_SECRET` | yes | Signs the session JWT |
| `APP_ORIGIN` | for QR demo | Origin encoded into share QR codes |

### `APP_ORIGIN` — read this before demoing QR sharing

Share QR codes encode an absolute URL. By default that URL is derived from the
incoming request, which on a laptop means `http://localhost:3000` — **a phone
scanning that code cannot reach it.** Before demoing, set `APP_ORIGIN` to an
address the phone can actually resolve:

```bash
# laptop's LAN address, phone on the same Wi-Fi
APP_ORIGIN=http://192.168.1.20:3000
```

Then start the dev server bound to all interfaces:

```bash
npm run dev -- --hostname 0.0.0.0
```

Copy/paste sharing works without this; only scan-to-view needs it.

### Native dependency note

`better-sqlite3` compiles a native binding and publishes no prebuilt binary for
Node 24 on Windows. On Node 24 you need Python plus VS Build Tools for
`npm install` to succeed; on an LTS Node (20/22) a prebuilt binary is fetched
and no toolchain is needed.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
