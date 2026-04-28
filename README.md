# E-Windo Delivery Reporting System (Local Storage Version)

A real-time delivery reporting system for Auto Pabrik E-Windo. This version is designed for testing and use without a database (Firebase), using your browser's **Local Storage** to persist data.

## Features
- **Dashboard**: Real-time charts and delivery trends.
- **Delivery Management**: Log and track actual deliveries.
- **Customer Management**: Manage targets and schedule (Admin only).
- **Excel Support**: Import and Export delivery records.
- **Local Persistence**: Data stays in your browser.

## How to Run Locally

### 1. Requirements
You must have [Node.js](https://nodejs.org/) installed on your computer.

### 2. Installation
Open your terminal (or VS Code terminal) and run:
```bash
npm install
```

### 3. Run Development Server
To start the app and see it in your browser, run:
```bash
npm run dev
```
Then open the URL shown in the terminal (usually `http://localhost:3000`).

### 4. Build for Static Hosting (e.g. GitHub Pages)
To create a version that you can upload to GitHub Pages or any static host:
```bash
npm run build
```
The output will be in the `dist` folder.

## Deployment to GitHub Pages
I have added a GitHub Action in `.github/workflows/deploy.yml`. When you export this project to GitHub:
1. Go to your repository **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every time you push to the `main` branch, it will automatically build and deploy your app.

## Troubleshooting
- **Blank Screen**: This happens if you open `index.html` directly from your file explorer. React applications must be served by a web server. Use `npm run dev` to view the app locally.
- **Admin Password**: The default password for Customer Management is `admin`.

## Project Structure
- `src/App.tsx`: Main logic and state management.
- `src/components/`: Reusable UI components.
- `src/constants.ts`: Initial seed data for customers.
- `src/types.ts`: TypeScript definitions.
