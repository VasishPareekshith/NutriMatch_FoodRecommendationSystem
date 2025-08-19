import React, { useState } from "react";
import axios from "axios";
// import leftImage from "./assets/left.jpg";
// import rightImage from "./assets/long.jpg";
//import placeholder from "./assets/placeholder.png"; // use a local placeholder image
import { decode } from 'he';

const OPTIONS = {
  NUTRITION: "nutrition",
  PERSONAL_GLOBAL: "personal_global",
  PERSONAL_INDIAN: "personal_indian",
};

const App = () => {
  const [method, setMethod] = useState(OPTIONS.NUTRITION);
  const [inputs, setInputs] = useState({
    calories: 500, fat: 30, saturated_fat: 10, cholesterol: 50, sodium: 2000,
    carbohydrates: 100, fiber: 10, sugar: 30, protein: 50,
    include_ingredients: "", exclude_ingredients: "",
    weight: 70, height: 170, age: 30, gender: "Male",
    activity_level: "moderately active", weight_loss: 0, meals_per_day: 3,
    diet: "Non-Veg"
  });
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [overlayRecipe, setOverlayRecipe] = useState(null);
  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const endpointMap = {
      [OPTIONS.NUTRITION]: "/recommend-by-nutrition",
      [OPTIONS.PERSONAL_GLOBAL]: "/recommend-by-personal-info",
      [OPTIONS.PERSONAL_INDIAN]: "/recommend-by-personal-india",
    };

    try {
      const response = await axios.post(`http://localhost:5000${endpointMap[method]}`, inputs);
      if (response.data?.Recommendations) {
        setRecipes(response.data.Recommendations);
      } else {
        throw new Error("No recommendations found");
      }
    } catch (error) {
      setError(error.response?.data?.error || "Failed to fetch recipes. Try again later.");
    }
  };

  const visibleFieldsMap = {
    [OPTIONS.NUTRITION]: [
      "calories", "fat", "saturated_fat", "cholesterol", "sodium", "carbohydrates", "fiber", "sugar", "protein",
      "include_ingredients", "exclude_ingredients", "diet"
    ],
    [OPTIONS.PERSONAL_GLOBAL]: [
      "weight", "height", "age", "gender", "activity_level", "weight_loss", "meals_per_day",
      "include_ingredients", "exclude_ingredients", "diet"
    ],
    [OPTIONS.PERSONAL_INDIAN]: [
      "weight", "height", "age", "gender", "activity_level", "weight_loss", "meals_per_day",
      "include_ingredients", "exclude_ingredients", "diet"
    ],
  };

  const renderInputField = (key) => {
    if (key === "gender" || key === "activity_level" || key === "diet") {
      const options = {
        gender: ["Male", "Female"],
        activity_level: ["sedentary", "lightly active", "moderately active", "very active", "super active"],
        diet: ["Non-Veg", "Veg", "Vegan"],
      };
      return (
        <select name={key} value={inputs[key]} onChange={handleChange} style={styles.input}>
          {options[key].map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
      );
    } else {
      return (
        <input
          type={typeof inputs[key] === "number" ? "number" : "text"}
          name={key}
          value={inputs[key]}
          onChange={handleChange}
          style={styles.input}
        />
      );
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.sideImageContainerLeft}>
      </div>
      <div style={styles.headerContainer}>
        <h1 style={styles.headerText}>🍽 FOOD RECOMMENDATION 🍽</h1>
      </div>
      <div style={styles.centerContainer}>
        <div style={styles.menu}>
          <label style={styles.label}>Recommendation Method:</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={styles.select}>
            <option value={OPTIONS.NUTRITION}>By Nutrition</option>
            <option value={OPTIONS.PERSONAL_GLOBAL}>By Personal Info (Global)</option>
            <option value={OPTIONS.PERSONAL_INDIAN}>By Personal Info (Indian)</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGrid}>
          {visibleFieldsMap[method].map((key) => (
            <div key={key} style={styles.inputGroup}>
              <label style={styles.label}>
                {key
                  .replace(/_/g, " ")
                  .split(" ")
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ")
                }
              </label>
              {renderInputField(key)}
            </div>
          ))}
        </div>

          <br />
          <button type="submit" style={styles.button}>Get Recommendations</button>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.grid}>
          {recipes.map((recipe, index) => (
            <div key={index} style={styles.card}>
              {/* {recipe.ImageURL && (
                <img
                  src={recipe.ImageURL}
                  alt={decode(recipe.Name || recipe.RecipeName)}
                  style={styles.image}
                  onError={e => { e.target.onerror = null; e.target.src = placeholder; }}
                />
              )} */}
              <h2 style={styles.recipeName}>
                {decode(recipe.Name || recipe.RecipeName)}
              </h2>
              <p><strong>Ingredients:</strong> {recipe.RecipeIngredientParts || recipe.Ingredients}</p>
              <p><strong> Calories:</strong>  {recipe.EstimatedCalories || recipe.Calories}</p>
              {recipe.Servings && <p><strong> Servings:</strong>  {recipe.Servings}</p>}
              {recipe.RecipeServings && <p><strong> Servings:</strong>  {recipe.RecipeServings}</p>}
              {recipe.RecipeYield && <p><strong> Yield:</strong>  {recipe.RecipeYield}</p>}

              {/* new button to pop up overlay */}
              <button
                style={styles.infoButton}
                onClick={() => setOverlayRecipe(recipe)}
              >
                View Instructions
              </button>
            </div>
          ))}
        </div>

        {/* overlay modal */}
        {overlayRecipe && (
          <div style={styles.overlay}>
            <div style={styles.overlayContent}>
              <h2>{decode(overlayRecipe.Name || overlayRecipe.RecipeName)}</h2>
              <p><strong> Instructions:</strong> </p>
              <p style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
                {decode(
                  overlayRecipe.RecipeInstructions ||
                  overlayRecipe.Instructions ||
                  "No instructions available."
                )}
              </p>
              <button
                style={styles.closeButton}
                onClick={() => setOverlayRecipe(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.sideImageContainerRight}>
      </div>
    </div>
  );
};
const styles = {
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  },
  headerContainer: {
    position: "fixed",
    marginLeft: "15vw",
    marginRight: "15vw",
    top: 0,
    width: "70vw",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:"black",
    fontSize: "22px",
    fontWeight: "bold",
    zIndex: 1000,
    border: "2px solid #C49655",
    color: "#C49655",
    textShadow: "-1px -1px 0 #181818, 1px -1px 0 #181818, -1px 1px 0 #181818, 1px 1px 0 #181818"
    
  },
  headerText: { margin: 0 },
  sideImageContainerLeft: {
    position: "fixed",
    left: 0,
    top: "60px",
    width: "15vw",
    height: "calc(100vh - 60px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sideImageContainerRight: {
    position: "fixed",
    right: 0,
    top: "60px",
    width: "15vw",
    
    height: "calc(100vh - 60px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  centerContainer: {
    width: "70.4vw",
    height: "calc(100vh - 60px)",
    marginLeft: "15vw",
    marginRight: "15vw",
    marginTop: "60px",
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "black", 
    border: "2px solid #C49655",
    textAlign: "center",
    boxSizing: "border-box",
    overflowY: "scroll",
    scrollbarWidth: "none",      
    msOverflowStyle: "none" 
  },
  infoButton: {
    marginTop: "10px",
    padding: "8px 12px",
    backgroundColor: "#C49655",
    border: "none",
    color: "#181818",
    borderRadius: "4px",
    cursor: "pointer",
  },
  
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
  },
  overlayContent: {
    backgroundColor: "#181818",
    padding: "20px",
    borderRadius: "8px",
    color: "#C49655",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  
  closeButton: {
    marginTop: "15px",
    padding: "8px 12px",
    backgroundColor: "#181818",
    border: "1px solid #C49655",
    color: "#C49655",
    borderRadius: "4px",
    cursor: "pointer",
  },  
  menu: {
    marginBottom: "20px",
  },
  form: {
    padding: "20px",
    borderRadius: "8px",
    backgroundColor: "#181818", // Bright Orange
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    marginBottom: "20px",
    border: "1px solid #C49655"

  },
  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    padding:"20px"
  },
  inputGroup: {
    width: "80%",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#C49655", // Dark Black
  },
  input: {
    width: "100%",
    padding: "8px",
    color:"#C49655",
    border: "1px solid #C49655", // Dark Brown
    borderRadius: "4px",
    backgroundColor: "black", // Bright Orange
  },
  select:{
    width: "100%",
    padding: "8px",
    color:"#C49655",
    border: "1px solid #C49655", // Dark Brown
    borderRadius: "4px",
    backgroundColor: "#181818", 
  },
  button: {
    padding: "10px",
    backgroundColor: "#C49655", // Dark Brown
    color: "#181818",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  card: {
    backgroundColor: "#181818", // Deep Red
    borderRadius: "10px",
    padding: "15px",
    textAlign: "center",
    border: "2px solid #C49655",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    color:" #C49655"
  },
  image: {
    width: "100%",
    height: "180px",
    borderRadius: "8px",
    objectFit: "cover",
  },
  error: {
    color: "#F2613F", // Bright Orange for errors
    fontWeight: "bold",
  },
};

export default App;
