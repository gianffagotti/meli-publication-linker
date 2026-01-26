# Meli Publication Linker

This project is a React application built with TypeScript and Vite, designed to manage stock rules between Mercado Libre publications (Mother/Child relationships). It allows linking publications to share stock, either as full units (1:1) or packs (N:1).

## Features

-   **Dashboard**: View all existing stock rules, grouped by "Mother" publication.
-   **Rule Editor**: Create and edit rules between publications.
    -   Search for Mother and Child publications.
    -   Auto-match variations based on SKU.
    -   Configure relationship type (FULL or PACK).
-   **Mock Data Support**: Run the application without a backend using local JSON files.
-   **Proxy Support**: Configured to proxy API requests to a local backend (Azure Functions) on port 7171.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **UI Library**: Material UI (MUI)
-   **Routing**: React Router DOM
-   **HTTP Client**: Axios

## Setup & Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Locally**:
    ```bash
    npm run dev
    ```
    The application will start at `http://localhost:5173`.

## Configuration

### Environment Variables

Create a `.env` file (or use `.env.local`) to configure the application:

-   `VITE_USE_MOCK=true`: Set to `true` to use local mock data (`src/mocks/`). Set to `false` or remove to use the real backend API.

### Proxy Configuration

The `vite.config.ts` is configured to proxy `/api` requests to `http://localhost:7171`. This is intended for development with a local Azure Functions backend.

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:7171',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## Project Structure

-   `src/components`: Reusable UI components (e.g., `StockRulesTable`, `ItemSearch`).
-   `src/pages`: Application pages (`DashboardPage`, `RuleEditorPage`, `LoginPage`).
-   `src/services`: API integration and data services.
    -   `ApiDataService.ts`: Real API implementation.
    -   `MockDataService.ts`: Mock data implementation.
    -   `apiFactory.ts`: Selects the service based on `VITE_USE_MOCK`.
-   `src/models`: TypeScript interfaces (`types.ts`).
-   `src/mocks`: JSON files for mock data.

## Data Models & Mocks

If running with `VITE_USE_MOCK=true`, ensure you have the following files in `src/mocks/`:

### 1. `src/mocks/mockItems.json`

Contains an array of `MeliItem` objects.

```typescript
interface MeliItem {
  id: string;
  title?: string;
  thumbnail?: string;
  variations: {
    id: number;
    user_product_id: string;
    sku?: string;
    description?: string;
  }[];
}
```

**Example:**
```json
[
  {
    "id": "MLA-BOXER-FLEX",
    "title": "Boxer Hombre Algodón Liso Premium",
    "thumbnail": "https://http2.mlstatic.com/...",
    "variations": [
      {
        "id": 101,
        "user_product_id": "UPID-BOX-N-S",
        "sku": "BOX-NEG-S",
        "description": "Negro S"
      }
    ]
  }
]
```

### 2. `src/mocks/mockRules.json`

Contains an array of `StockRuleGroup` objects.

```typescript
interface StockRuleGroup {
  motherItemId: string;
  motherTitle?: string;
  motherThumbnail?: string;
  rules: {
    motherUserProductId: string;
    childUserProductId: string;
    type: 'FULL' | 'PACK';
    packQuantity: number;
    motherItemId: string;
    childItemId: string;
    active: boolean;
    childSku?: string;
    childTitle?: string;
  }[];
}
```

**Example:**
```json
[
  {
    "motherItemId": "MLA-BOXER-FLEX",
    "motherTitle": "Boxer Hombre Algodón Liso Premium",
    "motherThumbnail": "https://http2.mlstatic.com/...",
    "rules": [
      {
        "motherUserProductId": "UPID-BOX-N-S",
        "childUserProductId": "UPID-BOX-N-S-FULL",
        "type": "FULL",
        "packQuantity": 1,
        "motherItemId": "MLA-BOXER-FLEX",
        "childItemId": "MLA-BOXER-FULL",
        "childSku": "BOX-NEG-S",
        "childTitle": "Boxer Hombre Algodón Liso Premium [FULL]",
        "active": true
      }
    ]
  }
]
```
