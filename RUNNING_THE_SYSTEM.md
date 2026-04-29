# Running the System Locally

## View Locally
To view the application locally without a development environment, you can use a simple HTTP server:

```bash
python3 -m http.server 8000 --directory dist
```

Alternatively, if you are developing and have the source code:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open the provided local URL (usually http://localhost:5173) in your browser.
