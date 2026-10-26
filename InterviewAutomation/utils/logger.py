import logging
import os


def get_logger():
    """
    Creates and returns a logger instance.
    """

    logger = logging.getLogger("InterviewAutomation")

    if logger.hasHandlers():
        return logger

    logger.setLevel(logging.INFO)

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_folder = os.path.join(project_root, "reports")
    log_file = os.path.join(log_folder, "automation.log")

    file_handler = logging.FileHandler(log_file)
    console_handler = logging.StreamHandler()

    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s"
    )

    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger