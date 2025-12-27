# Frontend - Seattle Uber Driver Optimizer

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure backend is running on port 3001

3. Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Configuration

The frontend is configured to proxy API requests to `http://localhost:3001`. If you change the backend port, update `vite.config.ts`.

