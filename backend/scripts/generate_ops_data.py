import csv
import random
from datetime import datetime, timedelta

OUTPUT_FILE = "mining_production_logs.csv"

# Define realistic ranges for each column
RANGE_RAINFALL = (0, 200)                # mm per day
RANGE_DOWNTIME = (0, 8)                  # equipment downtime hours per day
RANGE_BLASTING = (0, 4)                  # blasting delay hours per day
RANGE_TRUCKS = (10, 30)                  # active haul trucks per day
RANGE_SHORTFALL = (0, 500)               # shortfall in tonnes per day

start_date = datetime.today() - timedelta(days=365)

with open(OUTPUT_FILE, "w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["date", "rainfall_mm", "equipment_downtime_hrs", "blasting_delays_hrs", "active_haul_trucks", "shortfall_tons"])
    for i in range(365):
        cur_date = start_date + timedelta(days=i)
        rainfall = round(random.uniform(*RANGE_RAINFALL), 1)
        downtime = round(random.uniform(*RANGE_DOWNTIME), 2)
        blasting = round(random.uniform(*RANGE_BLASTING), 2)
        trucks = random.randint(*RANGE_TRUCKS)
        # Simple synthetic relationship: higher rainfall and downtime increase shortfall
        base_shortfall = random.uniform(*RANGE_SHORTFALL)
        shortfall = max(0, base_shortfall + rainfall * 0.5 + downtime * 10 + blasting * 5 - trucks * 2)
        shortfall = round(shortfall, 1)
        writer.writerow([
            cur_date.strftime("%Y-%m-%d"),
            rainfall,
            downtime,
            blasting,
            trucks,
            shortfall,
        ])
print(f"Generated synthetic data to {OUTPUT_FILE}")
