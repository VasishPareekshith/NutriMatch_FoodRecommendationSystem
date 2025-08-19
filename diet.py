import pandas as pd
import re

def parse_ingredients(ingredient_str):
    if pd.isna(ingredient_str):
        return []  # Return empty list for missing values
    
    # Clean and parse the ingredients list
    ingredient_str = ingredient_str.replace('-', '')  # Clean any hyphens
    ingredients = [item.strip().strip('"') for item in ingredient_str.split(',')]
    return ingredients

def classify_recipe(ingredients):
    non_veg_keywords = {
        'chicken', 'mutton', 'beef', 'pork', 'fish', 'shrimp', 'lamb', 'bacon', 'gelatin',
        'crab', 'lobster', 'oyster', 'squid', 'octopus', 'turkey', 'duck', 'ham',
        'pepperoni', 'salami', 'anchovy', 'clams', 'mussels', 'snail', 'veal',
        'quail', 'goat', 'kangaroo', 'rabbit', 'foie gras', 'caviar', 'egg', 'eggs'
    }

    dairy_keywords = {
        'milk', 'cheese', 'butter', 'yogurt', 'cream', 'ghee', 'curd', 'paneer',
        'whey', 'kefir', 'buttermilk', 'condensed milk', 'evaporated milk',
        'sour cream', 'custard', 'ice cream'
    }

    if not ingredients:
        return 'Non-Veg'

    ingredients = [item.lower() for item in ingredients]

    # Word-boundary based search to avoid false matches (e.g., egg vs eggplant)
    def contains_keyword(ingredient_list, keywords):
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            for ing in ingredient_list:
                if re.search(pattern, ing):
                    return True
        return False

    if contains_keyword(ingredients, non_veg_keywords):
        return 'Non-Veg'
    if contains_keyword(ingredients, dairy_keywords):
        return 'Veg'
    
    return 'Vegan'


# Load dataset
file_path = 'C:/PROJ/ML/updatedfullrecipes.csv'  # Update if needed
df = pd.read_csv(file_path)

# Parse and classify ingredients
df['ParsedIngredients'] = df['RecipeIngredientParts'].apply(parse_ingredients)
df['Diet'] = df['ParsedIngredients'].apply(classify_recipe)

# Drop temp column (ParsedIngredients) and original Diet column
df.drop(columns=['ParsedIngredients'], inplace=True)

# Save updated dataset
df.to_csv('updatedfullrecipes.csv', index=False)

print("Classification complete. Updated file saved as 'updated_recipes.csv'.")
