import json
import os


class ConfigReader:
    """
    Reads configuration values from config.json.
    """

    def __init__(self):
        project_root = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )

        config_path = os.path.join(
            project_root,
            "test_data",
            "config.json"
        )

        if not os.path.exists(config_path):
            raise FileNotFoundError(
                f"Configuration file not found:\n{config_path}"
            )

        with open(config_path, "r") as file:
            self.config = json.load(file)

    def get_value(self, key):
        """
        Returns the value for the given key.
        """
        return self.config.get(key)


# Create a single shared instance.
# This ensures config.json is loaded only once.
config = ConfigReader()