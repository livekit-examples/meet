from selenium.webdriver.common.by import By

from utils.config_reader import config
from utils.logger import get_logger
from utils.otp_reader import OTPReader
from utils.wait_utils import WaitUtils


class LoginPage:
    """
    Page Object for Login Page.
    """

    EMAIL_INPUT = (
        By.NAME,
        "email"
    )

    SEND_OTP_BUTTON = (
        By.XPATH,
        "//button[normalize-space()='Send OTP']"
    )

    OTP_INPUT = (
        By.XPATH,
        "//input[@autocomplete='one-time-code']"
    )

    VERIFY_OTP_BUTTON = (
        By.XPATH,
        "//button[normalize-space()='Verify OTP']"
    )

    def __init__(self, driver):
        self.driver = driver
        self.wait = WaitUtils(
            driver,
            config.get_value("timeout")
        )
        self.logger = get_logger()

    def enter_email(self):
        """
        Enter email.
        """
        self.logger.info("Entering email.")

        email_box = self.wait.wait_for_element_visible(
            self.EMAIL_INPUT
        )

        email_box.clear()
        email_box.send_keys(
            config.get_value("email")
        )

    def click_send_otp(self):
        """
        Click Send OTP.
        """
        self.logger.info("Clicking Send OTP.")

        button = self.wait.wait_for_element_clickable(
            self.SEND_OTP_BUTTON
        )

        button.click()

    def enter_otp(self, otp):
        """
        Enter OTP.
        """
        self.logger.info("Entering OTP.")

        otp_box = self.wait.wait_for_element_visible(
            self.OTP_INPUT
        )

        otp_box.click()
        otp_box.send_keys(otp)

    def click_verify(self):
        """
        Click Verify OTP.
        """
        self.logger.info("Clicking Verify OTP.")

        button = self.wait.wait_for_element_clickable(
            self.VERIFY_OTP_BUTTON
        )

        button.click()

    def login(self):
        """
        Complete login flow.
        """
        otp_reader = OTPReader()

        try:
            otp_reader.connect()

            previous_email_id = otp_reader.get_latest_email_id()

            self.enter_email()

            self.click_send_otp()

            otp = otp_reader.wait_for_new_otp(
                previous_email_id
            )

            self.enter_otp(otp)

            self.click_verify()

        finally:
            otp_reader.disconnect()