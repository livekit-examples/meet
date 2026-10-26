from selenium.webdriver.common.by import By

from utils.config_reader import config
from utils.logger import get_logger
from utils.wait_utils import WaitUtils


class JobsPage:
    """
    Page Object for the Dashboard / Jobs Page.
    """

    # ==========================
    # Locators
    # ==========================

    INTERVIEWS_MENU = (
        By.XPATH,
        "//span[normalize-space()='Interviews']"
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
        Verify that the Dashboard page has loaded.
        """
        self.logger.info("Verifying Dashboard page.")

        try:
            self.wait.wait_for_element_visible(
                self.INTERVIEWS_MENU
            )

            self.logger.info("Dashboard loaded successfully.")

            return True

        except Exception:

            self.logger.error("Dashboard did not load.")

            return False

    def click_interviews(self):
        """
        Click the Interviews menu.
        """
        self.logger.info("Opening Interviews page.")

        menu = self.wait.wait_for_element_clickable(
            self.INTERVIEWS_MENU
        )

        menu.click()