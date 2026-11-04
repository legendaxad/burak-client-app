# BURAK Customer

A mobile first BURAK restaurant ordering app built with Expo SDK 58, React Native, TypeScript, and Expo Router.

## Run locally

```bash
npm install
npm run start
```

Use the Expo CLI shortcuts to open Android, iOS, or web. Run `npm run lint` and `./node_modules/.bin/tsc --noEmit` for the project checks.

## What is included

- Home, menu, product details, cart, checkout, order confirmation, order history, order details, profile, settings, help, and about screens.
- Local mock products, categories, restaurant details, and order history under `src/data/`.
- Async data interfaces in `src/services/mockApi.ts`, ready to be replaced by future API calls.
- Cart, profile, and mock order persistence through AsyncStorage.
- Cash on delivery and a mock card-on-delivery choice; no real payments or backend requests.
- Design tokens in `src/theme/colors.ts`, based on BURAK’s dark, cream, and warm-gold Admin app branding.

## Project layout

- `src/app/` contains Expo Router screens and layouts.
- `src/components/` contains shared mobile UI.
- `src/context/` contains the cart, profile, and order state.
- `src/data/` contains mock fixtures.
- `src/services/` contains the mock data access layer.
- `assets/images/burak/` contains the bundled BURAK and menu imagery.

The five primary navigation tabs are Home, Menu, Cart, My Orders, and Profile. Product detail, checkout, confirmation, order detail, profile setup, settings, help, and about are secondary stack routes.

## Image credits

Menu photography is from Unsplash and is listed in [CREDITS.md](./assets/images/burak/CREDITS.md). The Admin app’s original project directory is not modified by this Customer app.
