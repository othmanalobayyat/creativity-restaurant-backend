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
