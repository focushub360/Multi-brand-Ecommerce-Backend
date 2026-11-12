# GROVE Multi-Category Marketplace

## Project Structure

```
├── frontend/                 # GROVE Marketplace Frontend Application (React + Vite)
│   ├── public/              # Static assets and images
│   ├── src/                 # Application source code
│   │   ├── assets/          # Icons and graphic assets
│   │   ├── components/      # Reusable UI components
│   │   ├── constants/       # Global constants
│   │   ├── data/            # JSON seed data & catalogues
│   │   ├── hooks/           # Custom React hooks (useCart, useWishlist, etc.)
│   │   ├── pages/           # Route views (Customer, Dealer, Admin, Categories)
│   │   ├── services/        # Service layers (addressService, orderService, etc.)
│   │   └── utils/           # Auth and utility helpers
│   ├── package.json         # Frontend dependencies and scripts
│   ├── vite.config.js       # Vite bundler configuration
│   └── vercel.json          # Frontend routing rules
├── package.json             # Root workspace runner
├── vercel.json              # Root deployment build config
└── .gitignore               # Root git ignore rules
```

## Running the Application

### Option 1: From the root directory
```bash
npm run dev      # Starts the frontend development server
npm run build    # Builds the production bundle
npm run lint     # Runs linter checks
```

### Option 2: From the `frontend/` directory
```bash
cd frontend
npm run dev      # Starts Vite dev server
npm run build    # Builds Vite production bundle
```

