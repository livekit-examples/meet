from selenium.webdriver.common.by import By

from utils.config_reader import config
from utils.logger import get_logger
from utils.wait_utils import WaitUtils


class InterviewSetsPage:
    """
    Page Object for the Interview Sets page.
    """

    # ==========================
    # Locators
    # ==========================

    CREATE_SET_BUTTON = (
        By.XPATH,
        "//button[normalize-space()='Create Set']"
    )

    # ==========================
    # Constructor
    # ==========================

    def __init__(self, driver):
        self.driver = driver
        self.wait = WaitUtils(
            driver,
            config.get_value("timeout")
        )
        self.logger = get_logger()

    # ==========================
    # Page Methods
    # ==========================

    def verify_page_loaded(self):
        """
        Verify Interview Sets page is loaded.
        """
        self.logger.info("Verifying Interview Sets page.")

        try:
            self.wait.wait_for_element_visible(
                self.CREATE_SET_BUTTON
            )

            self.logger.info(
                "Interview Sets page loaded successfully."
            )

            return True

        except Exception:

            self.logger.error(
                "Interview Sets page did not load."
            )

            return False

    def click_create_set(self):
        """
        Click the Create Set button.
        """
        self.logger.info("Clicking Create Set button.")

        button = self.wait.wait_for_element_clickable(
            self.CREATE_SET_BUTTON
        )

        button.click()