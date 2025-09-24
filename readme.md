# NutriMatch – Food Recommendation System

## 📖 Project Overview

NutriMatch is a **full-stack food recommendation system** that suggests recipes based on nutritional needs and dietary preferences.  
The system uses curated datasets of **Indian and American recipes**, applies **automated nutrition feature engineering and calorie estimation**, and delivers **personalized recipe recommendations** through an interactive React-based frontend.

The backend (Flask + Python) handles dataset processing, nutrition analysis, and recommendation logic using **machine learning techniques** such as nearest neighbor search and feature scaling. The frontend (React.js) provides a sleek user experience with **dynamic input forms, modal overlays, and a gold-on-black themed UI**.

This project showcases the integration of **data preprocessing, ML-driven recommendation, and full-stack web development**.

---

## 🎯 Key Features
- **Recipe Dataset Integration**  
  - Uses Indian and American recipe datasets with nutritional attributes.  
  - Automated feature engineering for calories and macro-nutrients.

- **Recommendation Engine**  
  - Applies **Nearest Neighbors algorithm** and **StandardScaler** for similarity search.  
  - Generates personalized suggestions based on calorie/nutrient preferences.

- **Frontend (React.js)**  
  - Dynamic input forms for user dietary preferences.  
  - Modal overlays for recipe details (ingredients, instructions, nutrition info).  
  - Gold-on-black themed UI for a modern look.

- **Backend (Flask + Python)**  
  - REST API endpoints for recipe queries and nutrition filtering.  
  - Preprocessing scripts for calorie estimation and feature normalization.  

- **Visualization & Results**  
  - Recipe recommendations filtered by **diet type, category, or ingredient**.  
  - Approximate calorie values displayed for each recipe.

---

## ⚙️ Tech Stack
- **Frontend**: React.js, Axios, HTML/CSS  
- **Backend**: Python, Flask, pandas, scikit-learn  
- **Machine Learning**: Feature Scaling, Nearest Neighbors  
- **Data**: Indian & American recipe datasets (CSV format)  

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. Usage

- Enter calorie/nutrient constraints or dietary preferences in the UI.

- The system filters recipes and provides top recommended recipes.

- Click a recipe card to view ingredients, preparation time, and nutritional breakdown.

---

## 📊 Example Outputs

- Recommended recipes tailored to calorie constraints (e.g., under 400 kcal).

- Nutrient-based filtering (low fat, high protein, low sugar).

- Personalized diet-specific lists (e.g., vegetarian, diabetic-friendly).
