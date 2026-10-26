from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

from utils.config_reader import config
from utils.logger import get_logger
from utils.wait_utils import WaitUtils


class InterviewDetailsPage:
    # class InterviewDetailsPage:

#      def __init__(self, driver, interview_data):
#         self.driver = driver
#         self.interview_data = interview_data
    """
    Page Object for Interview Details page.
    """

    # ==========================
    # Locators
    # ==========================

    ROLE_INPUT = (
        By.ID,
        "interview_set_role"
    )

    DURATION_DROPDOWN = (
        By.ID,
        "interview_set_duration"
    )

    MIN_EXPERIENCE_INPUT = (
        By.ID,
        "interview_set_experience_min"
    )

    MAX_EXPERIENCE_INPUT = (
        By.ID,
        "interview_set_experience_max"
    )

    CUSTOM_INSTRUCTION_TEXTAREA = (
        By.TAG_NAME,
        "textarea"
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
    # Page Methods
    # ==========================

    def enter_role(self, role):
        """
        Enter role.
        """
        self.logger.info(f"Entering role: {role}")

        role_box = self.wait.wait_for_element_visible(
            self.ROLE_INPUT
        )

        role_box.clear()
        role_box.send_keys(role)

    def select_duration(self, duration):
        """
        Select interview duration.

        Currently the application defaults to
        30 Minutes, so no action is required.
        """

        self.logger.info(
            f"Using interview duration: {duration}"
        )

        # Default value is already selected.
        # We'll implement dropdown selection later
        # if additional durations are needed.

    def enter_min_experience(self, experience):
        """
        Enter minimum experience.
        """

        self.logger.info(
            f"Entering minimum experience: {experience}"
        )

        textbox = self.wait.wait_for_element_visible(
            self.MIN_EXPERIENCE_INPUT
        )

        textbox.clear()
        textbox.send_keys(str(experience))

    def enter_max_experience(self, experience):
        """
        Enter maximum experience.
        """

        self.logger.info(
            f"Entering maximum experience: {experience}"
        )

        textbox = self.wait.wait_for_element_visible(
            self.MAX_EXPERIENCE_INPUT
        )

        textbox.clear()
        textbox.send_keys(str(experience))

    def enter_custom_instruction(self, instruction):
        """
        Enter custom instruction.
        """

        self.logger.info(
            "Entering custom instructions."
        )

        textarea = self.wait.wait_for_element_visible(
            self.CUSTOM_INSTRUCTION_TEXTAREA
        )

        textarea.clear()
        textarea.send_keys(instruction)

    def click_next(self):
        """
        Click Next button.
        """

        self.logger.info("Clicking Next button.")

        button = self.wait.wait_for_element_clickable(
            self.NEXT_BUTTON
        )

        button.click()

    def fill_interview_details(self,role):
        """
        Complete Interview Details page.
        """

        self.enter_role(role)

        self.select_duration("30 Minutes")

        self.enter_min_experience(0)

        self.enter_max_experience(1)

        self.enter_custom_instruction(
            "Ask me more questions Fastapi."
        )

        self.click_next()