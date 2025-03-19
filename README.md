# 📌 App Usage Tracker

## 🚀 Overview
This app tracks **active usage time** for VS Code (or other apps) on macOS by analyzing system logs. It provides accurate usage reports in **JSON and CSV format**.

## 📂 Features
✅ Track **only active usage** (excludes idle time).  
✅ Specify **custom date ranges** (`MM/DD/YYYY MM/DD/YYYY`).  
✅ **Exclude breaks longer than 4 hours** automatically.  
✅ **Save reports** to a `reports/` directory.  
✅ **Formatted output** for easy reading.

---

## 📥 Installation
### **1️⃣ Clone the Repository**
```sh
 git clone https://github.com/YOUR_GITHUB/app-usage-tracker-js.git
 cd app-usage-tracker-js
```

### **2️⃣ Install Dependencies**
```sh
yarn install
```

### **3️⃣ Install Required Tools**
Ensure **`log` (macOS built-in)** and **`tree` (via Homebrew)** are installed:
```sh
brew install tree
```

---

## 🛠 Usage
### **1️⃣ Track App Usage (VS Code)**
```sh
yarn track MM/DD/YYYY MM/DD/YYYY
```
✅ **Example:**
```sh
yarn track 02/17/2025 03/16/2025
```

📌 **What Happens?**
- Fetches VS Code logs **from 12:00 AM to 11:59 PM** in Mountain Time.
- Filters **only active (frontmost) usage**.
- Saves reports to: `reports/active_usage_MM-DD-YYYY_to_MM-DD-YYYY.json` & `.csv`

---

### **2️⃣ Format Code**
To clean up all files using Prettier:
```sh
yarn format
```

---

### **3️⃣ Show Directory Tree (Excluding Hidden & `node_modules`)**
```sh
yarn tree
```
📌 **Requires a function in `~/.zshrc`**:
```sh
tree_me() {
  tree --prune -I 'node_modules|.*'
}
```
Then, reload shell:
```sh
source ~/.zshrc
```
Now `yarn tree` will work correctly!

---

## 📊 View Reports
### **Check JSON Output**
```sh
cat reports/active_usage_02-17-2025_to_03-16-2025.json | jq
```

### **Check CSV Output**
```sh
cat reports/active_usage_02-17-2025_to_03-16-2025.csv
```

---

## 🔧 Future Enhancements
- **Track multiple apps** (e.g., Chrome, Terminal, Slack)
- **Automate daily tracking** using a cron job
- **Generate visual graphs**

🚀 **Enjoy tracking your app usage!** 🚀


yarn track 2025-02-17 2025-03-16 --author "Flavio Espinoza"



yarn track 02/17/2025 03/16/2025