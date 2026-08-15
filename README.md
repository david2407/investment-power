This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Live price refresh

The "Refresh prices" button pulls current quotes through a server route that proxies the Alpha Vantage API, so the API key never reaches the browser.

- Set the key in a local environment file (`.env.local`, gitignored):

  ```bash
  ALPHA_VANTAGE_API_KEY=your_key_here
  ```

- Stocks use `GLOBAL_QUOTE` and crypto uses `CURRENCY_EXCHANGE_RATE`, one request per unique symbol per refresh.
- The free tier allows roughly one request per second and 25 requests per day, so the client refreshes symbols one at a time (button shows live progress, ~1s per unique symbol) and one refresh is capped at 25 unique symbols. Rate-limited responses are retried with backoff.
- `GLOBAL_QUOTE` returns end-of-day prices by default; realtime or delayed US stock quotes may require a premium Alpha Vantage plan.
- Positions without a symbol are skipped and reported, and symbols must be entered for new positions.

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
