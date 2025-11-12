# Fees Management System

A comprehensive web application to manage student fees, track payments, generate receipts, and view reports. It supports role-based access for Admins, Accountants, Teachers, and Parents.

## ✨ Features

*   **Role-Based Access Control:** Differentiated dashboards and permissions for Admins, Accountants, Teachers, and Parents.
*   **Student Management:** Add, edit, and delete student profiles.
*   **Fee Payment Tracking:** Record payments with various modes (Cash, Cheque, UPI, Card).
*   **Automatic Fee Allocation:** Intelligently apply payments to outstanding dues, starting with the oldest.
*   **Dynamic Fee Structure:** Admins can configure annual fees for each class per academic session.
*   **User Management:** Admins can add, edit, and delete users.
*   **Comprehensive Reporting:**
    *   View class-wise outstanding fee summaries.
    *   Browse a complete history of all payments received.
*   **Receipt Generation:** Automatically generate and print payment receipts.
*   **Responsive Design:** Fully functional on both desktop and mobile devices.

## 🛠️ Technology Stack

*   **Frontend:** React, TypeScript
*   **Styling:** TailwindCSS
*   **State Management:** React Context API

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/fees-management-system.git
    cd fees-management-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm start
    ```
    The application should now be running on your local server.

## 🔑 Default Credentials

You can log in with the following default users:

| Role        | Username     | Password   |
|-------------|--------------|------------|
| **Admin**   | `admin`      | `password` |
| Accountant  | `accountant` | `password` |
| Teacher     | `teacher`    | `password` |
| Parent      | `parent`     | `password` |

## 📁 Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── Modal.tsx
│   │   ├── pages/
│   │   │   ├── ReportsPage.tsx
│   │   │   └── StudentsPage.tsx
│   │   └── Icons.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── DataContext.tsx
│   ├── students/
│   │   ├── PaymentsPage.tsx
│   │   └── StudentForm.tsx
│   ├── App.tsx
│   ├── constants.ts
│   ├── index.tsx
│   └── types.ts
├── .gitignore
├── index.html
├── LICENSE
├── metadata.json
└── README.md
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
