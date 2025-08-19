from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.neighbors import NearestNeighbors

app = Flask(__name__)
CORS(app)

# ─── 1) LOAD DATA ───────────────────────────────────────────────────────────────
DATA_PATH = "C:/PROJ/ML/updatedfullrecipes.csv"
INDIA_PATH = "C:/PROJ/ML/removedzerocal.csv"

data = pd.read_csv(DATA_PATH)
india_df = pd.read_csv(INDIA_PATH)

# Nutrient columns for vector
nutrient_cols = list(data.columns[16:25])

# ─── 2) PRECOMPUTE SCALER, PCA, CLUSTERS ────────────────────────────────────────
X = data[nutrient_cols].to_numpy()
scaler_num = StandardScaler().fit(X)
X_scaled = scaler_num.transform(X)

pca = PCA(n_components=5, random_state=42).fit(X_scaled)
X_pca = pca.transform(X_scaled)

kmeans = KMeans(n_clusters=10, random_state=42).fit(X_pca)
data["cluster"] = kmeans.labels_

# ─── 3) BMI & CALORIC NEEDS ────────────────────────────────────────────────────
def calculate_bmi(weight, height):
    return round(weight / ((height/100)**2), 2)

def calculate_calories(weight, height, age, gender,
                       activity_level, weight_loss, meals_per_day):
    if gender.lower() == 'male':
        bmr = 10*weight + 6.25*height - 5*age + 5
    else:
        bmr = 10*weight + 6.25*height - 5*age - 161

    multipliers = {
        "sedentary": 1.2, "lightly active": 1.375,
        "moderately active": 1.55, "very active": 1.725,
        "super active": 1.9
    }
    caloric_need = bmr * multipliers.get(activity_level, 1.55) - weight_loss*500
    return round(caloric_need,2), round(caloric_need/meals_per_day,2)

# ─── 4) DATA FILTERING HELPER ─────────────────────────────────────────────────
def preprocess_data(df, max_vals,
                    include_ings=None, exclude_ings=None,
                    category="All", diet="All"):
    df2 = df.copy()

    # Category filter (if you use column index 28 for category)
    if category != "All":
        df2 = df2[df2.iloc[:,28] == category]

    # Diet filter
    if diet.lower() == "veg":
        df2 = df2[df2["Diet"].isin(["Veg","Vegan"])]
    elif diet != "All":
        df2 = df2[df2["Diet"] == diet]

    # Nutritional thresholds
    for col, max_v in zip(nutrient_cols, max_vals):
        df2 = df2[df2[col] <= max_v]

    # Include ingredients
    if include_ings:
        for ing in include_ings:
            df2 = df2[df2["RecipeIngredientParts"]
                      .str.contains(ing, case=False, na=False)]

    # Exclude ingredients
    if exclude_ings:
        for ing in exclude_ings:
            df2 = df2[~df2["RecipeIngredientParts"]
                       .str.contains(ing, case=False, na=False)]

    return df2

# ─── 5) RECOMMENDATION (CLUSTER + KNN) ─────────────────────────────────────────
def recommend_recipes(user_nutrients, max_vals,
                      include_ings, exclude_ings, diet):
    # 5a) filter by diet, category, ingredients, nutrition
    df_filt = preprocess_data(data, max_vals,
                              include_ings, exclude_ings,
                              category="All", diet=diet)

    # drop entries without images
    if "Images" in df_filt.columns:
        df_filt = df_filt[df_filt["Images"].notna() &
                          (df_filt["Images"].str.strip() != "")]
    if df_filt.empty:
        return []

    # 5b) build user vector & project to cluster
    u = np.array([user_nutrients[k] for k in
                  ['calories','fat','saturated_fat','cholesterol',
                   'sodium','carbohydrates','fiber','sugar','protein']]).reshape(1,-1)
    u_scaled = scaler_num.transform(u)
    u_pca = pca.transform(u_scaled)
    user_cluster = int(kmeans.predict(u_pca)[0])

    # 5c) restrict to same cluster
    df_cl = df_filt[df_filt["cluster"] == user_cluster]
    if df_cl.empty:
        df_cl = df_filt

    # 5d) KNN search within cluster
    X_sub = scaler_num.transform(df_cl[nutrient_cols].to_numpy())
    neigh = NearestNeighbors(metric="cosine", algorithm="brute").fit(X_sub)
    dists, idxs = neigh.kneighbors(u_scaled, n_neighbors=min(12, len(df_cl)))

    # 5e) prepare output
    recs = df_cl.iloc[idxs[0]][[
        "RecipeId",
        "Name",
        "RecipeIngredientParts",       # R‐style list of names
        "RecipeIngredientQuantities",      # R‐style list of counts
        "Images",
        "Calories",
        "RecipeServings",
        "RecipeInstructions"
    ]].copy()

    # fill missing servings
    recs["RecipeServings"].fillna(1, inplace=True)

    # INLINE parse the R‐list of ingredient names into a Python list
    recs["IngredientList"] = recs["RecipeIngredientParts"].apply(
        lambda s: [
            p.strip().strip('"')
            for p in (
                # strip leading `c(` and trailing `)` if present
                (s[2:-1] if isinstance(s, str) and s.startswith("c(") and s.endswith(")") else "")
                # collapse double quotes
                .replace('""','"')
            ).split(",")
            if p
        ]
    )

    # INLINE parse the R‐list of counts into ints
    recs["CountList"] = recs["RecipeIngredientQuantities"].apply(
        lambda s: [
            p.strip().strip('"')
            for p in (
                (s[2:-1] if isinstance(s, str) and s.startswith("c(") and s.endswith(")") else "")
                .replace('""','"')
            ).split(",")
            if p
        ]
    )

    # Build a single field combining name + count
    recs["IngredientsWithCounts"] = recs.apply(
        lambda row: ", ".join(
            f"{count} {name}"
            for name, count in zip(row["IngredientList"], row["CountList"])
        ),
        axis=1
    )
    # drop the raw columns (and the intermediate lists)
    recs.drop(columns=[
        "RecipeIngredientParts",
        "RecipeIngredientQuantities",
        "IngredientList",
        "CountList"
    ], inplace=True)

    recs["RecipeServings"].fillna(1, inplace=True)
    # recs["RecipeIngredientParts"] = recs["RecipeIngredientParts"].apply(
    #     lambda x: ", ".join(x.replace('c("','')
    #                          .replace('")','')
    #                          .split('", "'))
    #     if isinstance(x, str) else x
    # )
    recs["RecipeInstructions"] = recs["RecipeInstructions"].apply(
        lambda x: ", ".join(x.replace('c("','')
                             .replace('")','')
                             .split('", "'))
        if isinstance(x, str) else x
    )
    return recs.to_dict(orient="records")

# ─── 6) INDIA‐SPECIFIC ROUTE ────────────────────────────────────────────────────
def recommend_indian_recipes(cal_per_meal, include_ings, exclude_ings, diet):
    df = india_df.copy()

    # diet filter
    if diet.lower() == "veg":
        df = df[df["Diet"].str.lower().isin(["veg","vegan"])]
    elif diet.lower() != "all":
        df = df[df["Diet"].str.lower() == diet.lower()]

    # include/exclude
    for ing in include_ings:
        if ing:
            df = df[df["Ingredients"]
                    .str.contains(ing, case=False, na=False)]
    for ing in exclude_ings:
        if ing:
            df = df[~df["Ingredients"]
                     .str.contains(ing, case=False, na=False)]

    # ensure calories numeric & filter by threshold
    df["Calories"] = pd.to_numeric(df["Calories"], errors="coerce")
    df = df[df["Calories"] <= cal_per_meal]

    # ** Robust image‐column filtering **
    if "Images" in df.columns:
        df = df[df["Images"].notna() &
                (df["Images"].str.strip() != "")]
    # else: just skip image filtering

    df.fillna("", inplace=True)

    # pick top‑9 by calories (or change to your desired sort)
    top = df.sort_values("Calories", ascending=False).head(9)
    return jsonify({"Recommendations": top.to_dict(orient="records")})

# ─── 7) FLASK ROUTES ──────────────────────────────────────────────────────────
@app.route("/recommend-by-nutrition", methods=["POST"])
def recommend_by_nutrition():
    payload = request.get_json()
    user_nutrients = {
        'calories': float(payload.get("calories",500)),
        'fat': float(payload.get("fat",30)),
        'saturated_fat': float(payload.get("saturated_fat",10)),
        'cholesterol': float(payload.get("cholesterol",50)),
        'sodium': float(payload.get("sodium",2000)),
        'carbohydrates': float(payload.get("carbohydrates",100)),
        'fiber': float(payload.get("fiber",10)),
        'sugar': float(payload.get("sugar",30)),
        'protein': float(payload.get("protein",50))
    }
    max_vals = list(user_nutrients.values())
    include_ings = [i.strip() for i in payload.get("include_ingredients","").split(",") if i.strip()]
    exclude_ings = [i.strip() for i in payload.get("exclude_ingredients","").split(",") if i.strip()]
    diet = payload.get("diet","All")

    recs = recommend_recipes(user_nutrients, max_vals, include_ings, exclude_ings, diet)
    return jsonify({"Recommendations": recs})


@app.route("/recommend-by-personal-info", methods=["POST"])
def recommend_by_personal_info():
    p = request.get_json()
    weight = float(p["weight"]); height = float(p["height"])
    age = int(p["age"]); gender = p["gender"]
    act = p["activity_level"]; wl = float(p.get("weight_loss",0))
    meals = int(p.get("meals_per_day",3))

    _, cal_meal = calculate_calories(weight, height, age, gender, act, wl, meals)
    max_vals = [cal_meal,20,8,60,700,100,10,20,25]
    include_ings = [i.strip() for i in p.get("include_ingredients","").split(",") if i.strip()]
    exclude_ings = [i.strip() for i in p.get("exclude_ingredients","").split(",") if i.strip()]
    diet = p.get("diet","All")

    recs = recommend_recipes(
        {'calories':cal_meal,'fat':20,'saturated_fat':8,'cholesterol':60,
         'sodium':700,'carbohydrates':100,'fiber':10,'sugar':20,'protein':25},
        max_vals, include_ings, exclude_ings, diet
    )
    return jsonify({"Recommendations": recs})


@app.route("/recommend-by-personal-india", methods=["POST"])
def recommend_by_personal_india():
    p = request.get_json()
    weight = float(p["weight"]); height = float(p["height"])
    age = int(p["age"]); gender = p["gender"]
    act = p["activity_level"]; wl = float(p.get("weight_loss",0))
    meals = int(p.get("meals_per_day",3))
    _, cal_meal = calculate_calories(weight, height, age, gender, act, wl, meals)

    include_ings = [i.strip() for i in p.get("include_ingredients","").split(",") if i.strip()]
    exclude_ings = [i.strip() for i in p.get("exclude_ingredients","").split(",") if i.strip()]
    diet = p.get("diet","All")

    return recommend_indian_recipes(cal_meal, include_ings, exclude_ings, diet)


if __name__ == "__main__":
    app.run(debug=True)
