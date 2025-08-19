import pandas as pd

# Load dataset
file_path = 'C:/PROJ/ML/indian_calories.csv'  # Use raw string to avoid escape issues
df = pd.read_csv(file_path)

# Drop unnecessary columns
drop_columns = ['Diet']
df.drop(columns=[col for col in drop_columns if col in df.columns], inplace=True)

# Rename columns
# rename_map = {
#     'TranslatedRecipeName': 'RecipeName',
#     'TranslatedIngredients': 'Ingredients',
#     'TranslatedInstructions': 'Instructions'
# }
# df.rename(columns=rename_map, inplace=True)

# Save updated dataset
df.to_csv('updated_recipes.csv', index=False)

print("Unnecessary columns dropped and columns renamed. Updated file saved as 'updated_recipes.csv'.")
