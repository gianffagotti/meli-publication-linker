# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Mock Data Setup

To run the application with mock data, ensure your `.env` file has `VITE_USE_MOCK=true`.

The mock data files are located in `src/mocks/` and are excluded from version control. You need to create them manually.

### Required Files

1.  `src/mocks/mockItems.json`: Contains an array of `MeliItem` objects.
2.  `src/mocks/mockRules.json`: Contains an array of `StockRuleGroup` objects.

### Data Structures

**MeliItem**
```json
{
  "id": "MLA123456",
  "title": "Product Title",
  "thumbnail": "http://http2.mlstatic.com/D_123456-MLA123456_122020-I.jpg",
  "logistic_type": "fulfillment",
  "sku": "SKU-123",
  "price": 100,
  "variations": [
    {
      "id": 123456789,
      "user_product_id": "MLAU123456",
      "attribute_combinations": [],
      "sku": "SKU-123-VAR"
    }
  ]
}
```

**StockRuleGroup**
```json
{
  "motherItemId": "MLA123456",
  "motherSku": "SKU-123",
  "rules": [
    {
      "motherUserProductId": "MLAU123456",
      "childUserProductId": "MLAU987654",
      "type": "FULL",
      "packQuantity": 1,
      "motherItemId": "MLA123456",
      "childItemId": "MLA987654",
      "active": true,
      "childSku": "SKU-CHILD",
      "childTitle": "Child Product Title"
    }
  ]
}
```

### Generating Mock Data with AI

You can use the following prompt to ask an AI (like ChatGPT, Claude, or Gemini) to generate sample data for you:

> Please generate two JSON files for a mock data layer in a TypeScript application.
>
> **File 1: `mockItems.json`**
> Generate an array of 10 objects matching this TypeScript interface:
> ```typescript
> interface MeliItem {
>   id: string; // e.g., "MLA" followed by digits
>   title: string;
>   thumbnail: string; // placeholder URL
>   logistic_type: string; // e.g., "fulfillment", "cross_docking", "self_service"
>   sku: string;
>   price: number;
>   variations: {
>     id: string | number;
>     user_product_id: string;
>     attribute_combinations: any[];
>     sku: string;
>   }[];
> }
> ```
>
> **File 2: `mockRules.json`**
> Generate an array of 5 objects matching this TypeScript interface. Ensure the `motherItemId` and `motherSku` correspond to items generated in `mockItems.json`.
> ```typescript
> interface StockRuleGroup {
>   motherItemId: string;
>   motherSku: string;
>   rules: {
>     motherUserProductId: string;
>     childUserProductId: string;
>     type: 'FULL' | 'PACK';
>     packQuantity: number;
>     motherItemId: string;
>     childItemId: string;
>     active: boolean;
>     childSku?: string;
>     childTitle?: string;
>   }[];
> }
> ```
> Please provide the raw JSON content for both files.
