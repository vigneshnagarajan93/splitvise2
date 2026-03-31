# Application Specification

## Core Features
1. **Dashboard:** View total balance (who owes whom).
2. **Add Expense:** A form to add a new expense (Title, Amount, Payer, Split With).
3. **Expense Feed:** A chronological list of past expenses.

## Notion Database Schema
The app expects a single Notion Database with the following properties:
- `Expense Name` (Title)
- `Amount` (Number)
- `Paid By` (Select: Person A, Person B)
- `Split With` (Multi-Select: Person A, Person B)
- `Date` (Date)

## Debt Calculation Algorithm
The frontend must calculate the simplified debts based on the feed. 
If Person A pays $100 split with Person B, Person B owes Person A $50.