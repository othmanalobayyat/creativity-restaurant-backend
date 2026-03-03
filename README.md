# Creativity Restaurant Backend API

A RESTful API built with **Node.js** and **Express** for a restaurant mobile application.  
It provides **JWT authentication**, **menu browsing**, **orders management**, **address management**, and a full **admin panel** for managing products, categories, and orders.  
Includes optional **Cloudinary upload** support for product images.

---

## Features

### Authentication & User

- Register / Login with **JWT**
- Get & update current user profile
- Change password (authenticated)

### Menu (Public)

- List categories
- List active items with search and category filtering
- Get item details by id

### Orders (User)

- Create orders with:
  - Default saved address OR address override
- View my orders
- View order details (order + items)

### Address (User)

- Get default address
- Create/update default address

### Admin Panel (Admin only)

- Dashboard:
  - Total orders & revenue
  - Orders count by status
  - Last 10 orders
- Categories CRUD + search
- Products CRUD + search + pagination
- Toggle product active/inactive (soft control)
- Orders list with filters + update order status

### Uploads

- Local upload endpoint using Multer (`/api/upload`)
- Cloudinary upload endpoint for admins (`/api/admin/upload`)

### Developer Utilities (Optional)

- Seed items endpoint (only if enabled by env flag)

---

## Tech Stack

- **Node.js** + **Express**
- **MySQL** using `mysql2/promise`
- Authentication: **JWT** + **bcryptjs**
- File Upload: **multer**
- Cloud Upload: **Cloudinary**
- Config: **dotenv**

---

## Project Structure

```
│
├── src/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── data/
├── scripts/ # one-time DB scripts
├── server.js
├── package.json
├── .env
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js installed
- A MySQL database (local or hosted e.g., Railway)
- (Optional) Cloudinary account for image uploads

### Installation

```bash
npm install
```

### Environment Variables

Create a .env file in project root:
communicate with me to get the file cotent

.env is ignored by git via .gitignore.

### Running the Server

Development (auto reload)

```bash
npm run dev
```

Production

```bash
npm start
```

Server starts on:

http://localhost:5000 (or PORT)

Health endpoint:

GET / → Backend is running ✅

---

### Authentication

Protected endpoints require:
Header

```bash
Authorization: Bearer <JWT_TOKEN>
```

---

### API Endpoints

Auth

POST /api/auth/register

POST /api/auth/login

PUT /api/auth/change-password (Auth)

Current User

GET /api/me (Auth)

PUT /api/me (Auth)

Menu (Public)

GET /api/categories

GET /api/items?search=&categoryId=

GET /api/items/:id

Address (User)

GET /api/me/address (Auth)

PUT /api/me/address (Auth)

Orders (User)

POST /api/orders (Auth)

GET /api/me/orders (Auth)

GET /api/orders/:id (Auth)

Upload (Local)

POST /api/upload (multipart/form-data file)

Upload (Cloudinary)

POST /api/admin/upload (Auth + Admin)

body: { base64: "data:image/..." }

---

### Admin Endpoints (Auth + Admin)

Dashboard

GET /api/admin/dashboard

Categories

GET /api/admin/categories?q=

GET /api/admin/categories/:id

POST /api/admin/categories

PUT /api/admin/categories/:id

DELETE /api/admin/categories/:id

Products

GET /api/admin/products?q=&categoryId=&limit=&offset=

GET /api/admin/products/:id

POST /api/admin/products

PUT /api/admin/products/:id

PUT /api/admin/products/:id/toggle-active

DELETE /api/admin/products/:id

Orders

GET /api/admin/orders?status=&q=&limit=&offset=

PUT /api/admin/orders/:id/status

To Be Continued
