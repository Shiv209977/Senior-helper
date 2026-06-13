import csv
from pathlib import Path

from django.core.management.base import BaseCommand

FEATURE_NAMES = [
    "age",
    "temperature",
    "heart_rate",
    "oxygen_level",
    "systolic_bp",
    "diastolic_bp",
    "pain_level",
    "fatigue_level",
    "appetite_level",
    "fever",
    "nausea",
    "vomiting",
    "breathing_difficulty",
    "bleeding",
    "infection_signs",
    "missed_med_24h",
    "missed_appt_30d",
    "emergency_30d",
]


class Command(BaseCommand):
    help = "Train a Random Forest risk classifier from a synthetic CSV dataset and save the model."

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv",
            default=None,
            help="Path to the CSV dataset file. Defaults to data/ai_risk_dataset.csv relative to BASE_DIR.",
        )

    def handle(self, *args, **options):
        from django.conf import settings

        csv_path = options["csv"]
        if csv_path is None:
            csv_path = Path(settings.BASE_DIR) / "data" / "ai_risk_dataset.csv"

        if not Path(csv_path).exists():
            self.stderr.write(self.style.ERROR(f"Dataset not found: {csv_path}"))
            self.stderr.write("Generate one or use the --csv flag to point to a valid CSV.")
            return

        try:
            import pandas as pd
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.metrics import classification_report
            from sklearn.model_selection import train_test_split
            import joblib
        except ImportError as e:
            self.stderr.write(self.style.ERROR(f"Missing dependency: {e}"))
            self.stderr.write("Install with: pip install pandas scikit-learn joblib")
            return

        self.stdout.write(f"Loading dataset from {csv_path}...")
        df = pd.read_csv(csv_path)

        if "risk_category" not in df.columns:
            self.stderr.write(self.style.ERROR("CSV must have a 'risk_category' column as the label."))
            return

        missing_features = [f for f in FEATURE_NAMES if f not in df.columns]
        if missing_features:
            self.stderr.write(self.style.ERROR(f"Missing feature columns: {missing_features}"))
            return

        X = df[FEATURE_NAMES].fillna(0)
        y = df["risk_category"]

        self.stdout.write(f"Dataset: {len(df)} samples, {len(FEATURE_NAMES)} features")
        self.stdout.write(f"Class distribution:\n{y.value_counts().to_string()}")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

        self.stdout.write("Training Random Forest classifier...")
        model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        self.stdout.write("\nClassification report (test set):\n")
        self.stdout.write(classification_report(y_test, y_pred))

        model_dir = Path(settings.BASE_DIR) / "apps" / "ai_assessment" / "ml"
        model_dir.mkdir(parents=True, exist_ok=True)
        model_path = model_dir / "risk_model.joblib"
        joblib.dump(model, model_path)
        self.stdout.write(self.style.SUCCESS(f"Model saved to {model_path}"))
