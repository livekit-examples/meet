from selenium.webdriver.common.by import By

from utils.config_reader import config
from utils.logger import get_logger
from utils.wait_utils import WaitUtils


class InterviewSettingsPage:
    """
    Page Object for Interview Settings page.
    """

    # ==========================
    # Locators
    # ==========================

    # Interview Type Switches
    DIRECT_SWITCH = (
        By.XPATH,
        "(//button[@role='switch'])[1]"
    )

    BEHAVIORAL_SWITCH = (
        By.XPATH,
        "(//button[@role='switch'])[2]"
    )

    BEI_SWITCH = (
        By.XPATH,
        "(//button[@role='switch'])[3]"
    )

    # Avatar Cards
    FEMALE_AVATAR = (
        By.XPATH,
        "//img[@alt='Female avatar']"
    )

    MALE_AVATAR = (
        By.XPATH,
        "//img[@alt='Male avatar']"
    )

    NEXT_BUTTON = (
        By.XPATH,
        "//button[normalize-space()='Next']"
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
    # Private Methods
    # ==========================

    def _set_switch(self, locator):
        """
        Turn ON a switch only if it is currently OFF.
        """
        switch = self.wait.wait_for_element_clickable(locator)

        state = switch.get_attribute("aria-checked")

        if state == "false":
            switch.click()

    # ==========================
    # Page Methods
    # ==========================

    def select_interview_type(self, interview_type):
        """
        Select interview type.
        """

        self.logger.info(
            f"Selecting interview type: {interview_type}"
        )

        interview_type = interview_type.lower()

        if interview_type == "direct":
            self._set_switch(self.DIRECT_SWITCH)

        elif interview_type == "behavioral":
            self._set_switch(self.BEHAVIORAL_SWITCH)

        elif interview_type == "bei":
            self._set_switch(self.BEI_SWITCH)

        else:
            raise ValueError(
                f"Invalid interview type: {interview_type}"
            )

    def select_avatar(self, avatar):
        """
        Select interviewer avatar.
        """

        self.logger.info(
            f"Selecting avatar: {avatar}"
        )

        avatar = avatar.lower()

        if avatar == "female":

            self.wait.wait_for_element_clickable(
                self.FEMALE_AVATAR
            ).click()

        elif avatar == "male":

            self.wait.wait_for_element_clickable(
                self.MALE_AVATAR
            ).click()

        else:
            raise ValueError(
                f"Invalid avatar: {avatar}"
            )

    def click_next(self):
        """
        Click Next button.
        """

        self.logger.info("Clicking Next button.")

        self.wait.wait_for_element_clickable(
            self.NEXT_BUTTON
        ).click()

    def configure_interview(self):
        """
        Complete Interview Settings page.
        """

        self.select_interview_type("Direct")

        self.select_avatar("Female")

        self.click_next()