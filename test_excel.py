import pandas as pd
import os

folder = r'C:\Interview Preparation Platform\data\selection insights'
for file in os.listdir(folder):
    if file.endswith('.xlsx'):
        path = os.path.join(folder, file)
        try:
            df = pd.read_excel(path)
            print(f"--- {file} ---")
            print("Columns:", list(df.columns))
            print("First row:")
            if len(df) > 0:
                print(df.iloc[0].to_dict())
            print("\n")
        except Exception as e:
            print(f"Error reading {file}: {e}")
