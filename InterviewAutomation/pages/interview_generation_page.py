import time

from selenium.webdriver.common.by import By

from utils.config_reader import config
from utils.logger import get_logger
from utils.wait_utils import WaitUtils


class InterviewGenerationPage:
    """
    Page Object for Interview Generation page.
    """

    # ==========================
    # Locators
    # ==========================

    SAVE_BUTTON = (
        By.XPATH,
        "(//button[normalize-space()='Save'])[1]"
    )

    CONFIRM_SAVE_BUTTON = (
        By.XPATH,
        "(//button[normalize-space()='Save'])[2]"
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

    def wait_for_generation(self):
        """
        Wait for interview generation to complete.
        """

        self.logger.info(
            "Waiting for interview generation..."
        )

        time.sleep(25)

    def click_save(self):
        """
        Click Save button.
        """

        self.logger.info(
            "Clicking Save button."
        )

        button = self.wait.wait_for_element_clickable(
            self.SAVE_BUTTON
        )

        button.click()

    def confirm_save(self):
        """
        Confirm interview creation.
        """

        self.logger.info(
            "Confirming interview creation."
        )

        button = self.wait.wait_for_element_clickable(
            self.CONFIRM_SAVE_BUTTON
        )

        button.click()

    def generate_interview(self):
        """
        Complete interview generation flow.
        """

        self.wait_for_generation()

        self.click_save()

        self.confirm_save()