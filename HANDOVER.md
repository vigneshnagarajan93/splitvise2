# SplitNotion Handover

## Overview
SplitNotion is a Splitwise clone that tracks shared expenses and calculates debts between participants. It uses React 18 (Vite) for the frontend and Netlify Serverless Functions as a proxy to the Notion API database.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Backend**: Netlify Serverless Functions (Node.js)
- **Database**: Notion API
- **Deployment**: Netlify

## Architecture
**Critical rule**: All Notion API calls must go through `/netlify/functions/`. The React frontend never calls Notion directly.

### Key Files
- `src/App.jsx` — Root component with expense fetching and form toggling
- `src/api/expenses.js` — Client functions: `getExpenses()`, `addExpense()`
- `src/utils/debtCalculator.js` — Debt calculation with greedy simplification
- `netlify/functions/getExpenses.js` — Notion database query
- `netlify/functions/addExpense.js` — Notion page creation

## Notion Database Schema
Must match exactly in Notion:
- `Expense Name` (Title)
- `Amount` (Number)
- `Paid By` (Select)
- `Split With` (Multi-Select)
- `Date` (Date)

## Debt Algorithm
For each expense: each person in `splitWith` owes `amount / (splitWith.length + 1)` to `paidBy`. Net balances are simplified using a greedy algorithm.

## Development

### Start Development
```bash
netlify dev    # Starts Vite (5173) + Functions server (8888) with proxy
```

### Build for Production
```bash
npm run build
```

### Environment Variables
Required in `.env`:
```
VITE_NOTION_API_KEY=<your_key>
VITE_NOTION_DATABASE_ID=<your_db_id>
```

## Current Status
- **Phase 1**: ✅ Scaffolding, dependencies, serverless functions
- **Phase 2**: ✅ Full UI (Dashboard, AddExpenseForm, ExpenseFeed, wiring)
- **Phase 3**: TODO — Edit/delete expenses, person config, persistence improvements

## Bugs Fixed (Phase 2 debug session)
| # | Issue | Fix |
|---|---|---|
| 1 | `netlify-cli` not installed → functions server never started | Added `netlify-cli` to devDependencies |
| 2 | `"dev": "vite"` in package.json → wrong server | Changed to `"dev": "netlify dev"` |
| 3 | Notion DB not shared with integration → 404/500 | **Manual step required** (see below) |

### Manual Step Required — Share Notion DB
1. Open the database in Notion
2. Click `...` (top-right) → **Connections** → **Connect to** → select **SplitVise** integration

## Next Steps
1. Confirm Notion database is shared with integration (see above)
2. Run `npm run dev` (now calls `netlify dev`) and verify no 500 errors
3. Implement edit/delete functionality (Phase 3)
4. Add configurable person names
