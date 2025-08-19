import React, { useState } from "react";
import axios from "axios";

// Import local images
import leftImage from "./assets/left.jpg";
import rightImage from "./assets/long.jpg";

function App() {
  const [method, setMethod] = useState("nutrition");
  const [personalDataset, setPersonalDataset] = useState("global");
  const [inputs, setInputs] = useState({
    calories: 500, fat: 30, saturated_fat: 10, cholesterol: 50, sodium: 2000,
    carbohydrates: 100, fiber: 10, sugar: 30, protein: 50,
    include_ingredients: "", exclude_ingredients: "", category: "All",
    weight: 70, height: 170, age: 30, gender: "Male",
    activity_level: "moderately active", weight_loss: 0, meals_per_day: 3,
    diet: "Non-Veg"  // 👈 add this line
  });
  

  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
    console.log(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    const endpoint =
      method === "nutrition"
        ? "/recommend-by-nutrition"
        : personalDataset === "indian"
        ? "/recommend-by-personal-india"
        : "/recommend-by-personal-info";
  
    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, inputs);
      if (response.data && response.data.Recommendations) {
        setRecipes(response.data.Recommendations);
      } else {
        throw new Error("No recommendations found");
      }
    } catch (error) {
      console.error("Error fetching recommendations", error);
      setError(error.response ? error.response.data.error : "Failed to fetch recipes. Try again later.");
    }
  };
  
  

  return (
    <div style={styles.pageContainer}>
      {/* Top Header */}
      <div style={styles.headerContainer}>
        <h1 style={styles.headerText}>🍽 FOOD RECOMMENDATION 🍽 </h1>
      </div>

      {/* Left Image */}
      <div style={styles.sideImageContainerLeft}>
        <img src={leftImage} alt="Left" style={styles.sideImage} />
      </div>

      {/* Main Content (Scrollable) */}
      <div style={styles.centerContainer}>

        <div style={styles.menu}>
          <label style={styles.label}>Choose Input Method:</label>
          <select onChange={(e) => setMethod(e.target.value)} value={method} style={styles.input}>
            <option value="nutrition">By Nutritional Values</option>
            <option value="personal">By Personal Information</option>
          </select>
          {method === "personal" && (
            <div>
              <label style={styles.label}>Choose Dataset:</label>
              <select value={personalDataset} onChange={(e) => setPersonalDataset(e.target.value)} style={styles.input}>
                <option value="global">Global Dataset</option>
                <option value="indian">Indian Dataset</option>
              </select>
            </div>
          )}

        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGrid}>
            {Object.keys(inputs).map((key) =>
              (method === "nutrition" && ["weight", "height", "age", "gender", "activity_level", "weight_loss", "meals_per_day"].includes(key)) ||
              (method === "personal" && ["calories", "fat", "saturated_fat", "cholesterol", "sodium", "carbohydrates", "fiber", "sugar", "protein"].includes(key))
                ? null
                : (
                  <div key={key} style={styles.inputGroup}>
                    <label style={styles.label}>{key.replace("_", " ")}:</label>
                    {key === "gender" || key === "activity_level" ? (
                      <select name={key} value={inputs[key]} onChange={handleChange} style={styles.input}>
                        {key === "gender" ? (
                          <>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </>
                        ) : (
                          <>
                            <option value="sedentary">Sedentary</option>
                            <option value="lightly active">Lightly Active</option>
                            <option value="moderately active">Moderately Active</option>
                            <option value="very active">Very Active</option>
                            <option value="super active">Super Active</option>
                          </>
                        )}
                      </select>
                    ) : key === "diet" ? (
                      <select name="diet" value={inputs.diet} onChange={handleChange} style={styles.input}>
                        <option value="Non-Veg">All</option>
                        <option value="Veg">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    ) : (
                      <input
                        type={typeof inputs[key] === "number" ? "number" : "text"}
                        name={key}
                        value={inputs[key]}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    )}
                  </div>
                )
            )}
          </div>

          <br></br>
          <button type="submit" style={styles.button}>Get Recommendations</button>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.grid}>
          {recipes.length > 0 && recipes.map((recipe, index) => (
            <div key={index} style={styles.card}>
              {recipe.Images && <img src={recipe.Images} alt={recipe.Name || recipe.RecipeName} style={styles.image} />}
              <h2 style={styles.recipeName}>{recipe.Name || recipe.RecipeName}</h2>
              <p style={styles.ingredients}>
                Ingredients: {recipe.RecipeIngredientParts || recipe.Ingredients}
              </p>
              <p>Calories: {recipe.EstimatedCalories || recipe.Calories}</p>
              {recipe.URL && <a href={recipe.URL} target="_blank" rel="noopener noreferrer">View Full Recipe</a>}
            </div>
          ))}
        </div>
      </div>

      {/* Right Image */}
      <div style={styles.sideImageContainerRight}>
        <img src={rightImage} alt="Right" style={styles.sideImage} />
      </div>
    </div>
  );
}

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
    top: 0,
    width: "100vw",
    height: "60px",
    backgroundColor: "#FF6F00",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "24px",
    fontWeight: "bold",
    zIndex: 1000,
  },
  headerText: {
    margin: 0,
  },
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
    backgroundColor: "#fff",
  },
  sideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  centerContainer: {
    width: "70vw",  // Adjusted to avoid overlap (was 70vw)
    height: "calc(100vh - 60px)",
    marginLeft: "15vw",
    marginRight: "17vw", // Increased margin to avoid overlap (was 15vw)
    marginTop: "60px",
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
    boxSizing: "border-box", // Prevents layout issues
  },
  heading: { fontSize: "24px", fontWeight: "bold", marginBottom: "20px" },
  menu: { marginBottom: "20px" },
  form: { padding: "20px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", marginBottom: "20px" },
  inputGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
  inputGroup: { width: "100%" },
  label: { display: "block", fontWeight: "bold", marginBottom: "5px" },
  input: { width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
  button: { 
    padding: "10px", 
    backgroundColor: "#007BFF", 
    color: "white", 
    border: "none", 
    borderRadius: "5px", 
    fontSize: "16px", 
    cursor: "pointer" 
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
  card: { backgroundColor: "#FFF3E0", borderRadius: "10px", padding: "15px", textAlign: "center" },
  image: { width: "100%", height: "180px", borderRadius: "8px" },
};


export default App;