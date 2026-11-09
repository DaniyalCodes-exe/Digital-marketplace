# DigiAi

DigiAi is a digital-product marketplace. Partners can sign in to manage their profiles and products. Customers can open a partner's shared product link, pay through Razorpay, and access the product download without creating an account.

The application consists of a React frontend, an API gateway, and separate authentication, product, and order services. Admin features require an account with the `admin` database role.

## Requirements

- Node.js 20.19 or newer, or 22.12 or newer, and npm
- MongoDB
- Redis
- A Firebase project with Google sign-in enabled
- Razorpay test credentials for local payment testing

## Environment setup

Run these commands from the project root to create local environment files:

```sh
cp frontend/.env.example frontend/.env
cp backend/gateway/.env.example backend/gateway/.env
cp backend/services/auth/.env.example backend/services/auth/.env
cp backend/services/product/.env.example backend/services/product/.env
cp backend/services/order/.env.example backend/services/order/.env
```

Replace the placeholder values in each `.env` file:

- `frontend/.env`: set `VITE_FIREBASE_APIKEY` to the Firebase web app API key.
- `backend/services/auth/.env`: set the Firebase service-account values and MongoDB and Redis URLs.
- `backend/services/product/.env`: set the MongoDB and Redis URLs.
- `backend/services/order/.env`: set the MongoDB URL and Razorpay test key ID and secret.
- `backend/gateway/.env`: set the frontend origin and the URLs for the authentication, product, and order services.

The example configuration uses port `5000` for the gateway, `5001` for authentication, `5002` for products, `5003` for orders, and `5173` for the frontend. If you change a port, update the corresponding service URL in `backend/gateway/.env` and set `FRONTEND_URL` to the frontend's origin.

## Install dependencies

Run each command from the project root:

```sh
npm --prefix frontend install
npm --prefix backend install
npm --prefix backend/services/auth install
npm --prefix backend/services/product install
npm --prefix backend/services/order install
npm --prefix backend/gateway install
```

## Run locally

Start MongoDB and Redis first. Then run each command below in a separate terminal from the project root:

```sh
npm --prefix backend/services/auth run dev
```

```sh
npm --prefix backend/services/product run dev
```

```sh
npm --prefix backend/services/order run dev
```

```sh
npm --prefix backend/gateway run dev
```

```sh
npm --prefix frontend run dev
```

Open the frontend URL printed by Vite, normally `http://localhost:5173`.

## Build and lint

Run these commands from the project root:

```sh
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend/services/auth run build
npm --prefix backend/services/product run build
npm --prefix backend/services/order run build
npm --prefix backend/gateway run build
```

The project does not currently include an automated test suite.
# Digital-marketplace
# Digital-marketplace
