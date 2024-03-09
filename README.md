## Goal
This is a minimal web app to showcase the use of Web3Modal + Wagmi to send a transaction using [Zyfi](https://www.zyfi.org/)'s paymaster on zkSync.

It is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, head to https://cloud.walletconnect.com/ to create a project ID. Then, create a `.env` file in the root folder and add the line containing your project ID:

```
NEXT_PUBLIC_PROJECT_ID=a4e8...
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to test.

You should check the console logs when testing with different wallets to assess their behavior with the paymaster.
