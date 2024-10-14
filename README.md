# 🗂️ Tasker

Tasker is a task management application designed for departmental use. It allows users to assign tasks, manage team roles, and receive notifications about task updates. This project was developed to streamline task management and improve productivity within a team.

## 🚀 Features

- **Role-Based Access:**
  - **Admin:** Full access to assign tasks to anyone, add and remove users, and manage other administrative functions.
  - **Team Leader (TL):** Can assign tasks to team members but cannot add or remove users.
  - **User:** Can only take tasks and mark them as complete.

- **Task Management:**
  - View and manage old tasks.
  - Assign new tasks to team members.
  - Edit task details and member information.
  - Filter tasks based on various criteria.

- **Notification System:**
  - Receive notifications when tasks are assigned.
  - Get notified when a task is marked as completed.

- **Role Selection and OTP Verification:**
  - On app launch, users select their position, team, and name.
  - Verify identity via OTP sent to their email.

## 📂 Project Structure

/tasker 
│  
├── /assets          # Application assets 
│  
├── /components      # Reusable components 
│  
├── /screens         # App screens 
│  
├── App.js           # Main entry point of the app 
│  
├── config.js        # Firebase Config file 
│  
└── README.md


## 🛠️ Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Creative-banda/Tasker.git

2. Install the dependencies:
```bash
  cd tasker
  npm install
```

3. Set up your Firebase project and update the configuration in **config.js.**

4. Run the app:
```bash
 npx expo start
```

## 📄 License

This project is licensed under the **MIT License**.

## 👤 Author

**Mohd Ahtesham** - https://www.linkedin.com/in/yourprofile](https://www.linkedin.com/in/ahtesham-khan-808260311/

