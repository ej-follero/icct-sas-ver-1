# ICCT Smart Attendance System

A modern web application for smart attendance management for ICCT Colleges, built with Next.js, React, Prisma, Tailwind CSS, and more.

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. **Clone the Repository**
```sh
git clone <repo-url>
cd icct-smart-attendance-system
```

### 2. **Install Node.js**
- Make sure you have **Node.js** (v18 or later) and **npm** installed.
- [Download Node.js here](https://nodejs.org/)

### 3. **Install Dependencies**
```sh
npm install
```

### 4. **Set Up Environment Variables**
- Copy the example environment file or create a `.env` file in the root directory.
- Fill in the required environment variables

Example:
```sh
cp .env.example .env
# Then edit .env as needed
```

### 5. **Set Up the Database**
- Run Prisma migrations to set up your database schema:
```sh
npx prisma migrate dev
```
- (Optional) Seed the database if a seed script is provided:
```sh
npx prisma db seed
```

### 6. **Run the Development Server**
```sh
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. **Build for Production (Optional)**
```sh
npm run build
npm start
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI, Lucide React, Framer Motion, Recharts
- **Backend:** Prisma, bcrypt, Zod, date-fns
- **Database:** (Configure in `.env`)
- **Other:** XLSX, jsPDF, React Hook Form, and more

---

## 📄 License

This project is for educational purposes.