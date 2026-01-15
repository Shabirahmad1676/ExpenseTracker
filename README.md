# Montra Expense Tracker

A modern expense tracking application built with **React Native (Expo)** and **Firebase**.

## Features

-   **Expense & Income Tracking**: Log daily transactions.
-   **Wallets**: Manage multiple accounts/wallets.
-   **Marketplace**: View real-time product prices filtered by your actual purchasing power (Budget).
-   **Statistics**: Visual breakdown of your spending.

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/expense-tracker.git
    cd expense-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Firebase Setup**
    -   Create a Firebase project.
    -   Enable Authentication (Email/Password) and Firestore.
    -   Update `config/firebase.ts` with your credentials.

4.  **Run the app**
    ```bash
    npx expo start
    ```

## Tech Stack

-   React Native (Expo Router)
-   Firebase (Auth, Firestore)
-   Victory Native (Charts)
