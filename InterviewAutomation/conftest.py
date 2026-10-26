import os
from datetime import datetime
import json
import pytest

from selenium import webdriver
from selenium.webdriver.chrome.service import Service

from webdriver_manager.chrome import ChromeDriverManager

from utils.config_reader import config
from utils.logger import get_logger


logger = get_logger()


@pytest.fixture()
def driver():
    """
    Launch Chrome browser before each test
    and close it after the test completes.
    """

    logger.info("=" * 50)
    logger.info("Test Started")

    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--start-maximized")

    logger.info("Launching Chrome browser...")

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )

    base_url = config.get_value("base_url")

    logger.info(f"Opening application: {base_url}")

    driver.get(base_url)

    yield driver

    logger.info("Closing browser.")

    driver.quit()

    logger.info("Test Finished")
    logger.info("=" * 50)


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Capture screenshot whenever a test fails.
    """

    outcome = yield
    report = outcome.get_result()

    if report.when != "call":
        return

    if report.passed:
        return

    driver = item.funcargs.get("driver")

    if driver is None:
        return

    screenshot_dir = "screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    screenshot_name = f"{item.name}_{timestamp}.png"

    screenshot_path = os.path.join(
        screenshot_dir,
        screenshot_name
    )

    driver.save_screenshot(screenshot_path)

    logger.error(
        f"Screenshot captured: {screenshot_path}"
    )

    if hasattr(report, "extras"):
        import pytest_html

        extra = getattr(report, "extras")

        extra.append(
            pytest_html.extras.image(screenshot_path)
        )

        report.extras = extra


def pytest_configure(config):
    """
    Add custom metadata to HTML report.
    """

    config.stash[pytest.StashKey[dict]] = {}

@pytest.fixture
def interview_data():
    json_path = os.path.join(
        os.path.dirname(__file__),
        "test_data",
        "conftest_interview.json"
    )

    with open(json_path, "r") as file:
        return json.load(file)