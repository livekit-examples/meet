from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class WaitUtils:
    """
    Utility class for handling explicit waits.
    """

    def __init__(self, driver, timeout):
        self.driver = driver
        self.wait = WebDriverWait(driver, timeout)

    def wait_for_element_visible(self, locator):
        """
        Wait until an element becomes visible.
        """
        return self.wait.until(
            EC.visibility_of_element_located(locator)
        )

    def wait_for_element_clickable(self, locator):
        """
        Wait until an element becomes clickable.
        """
        return self.wait.until(
            EC.element_to_be_clickable(locator)
        )

    def wait_for_element_present(self, locator):
        """
        Wait until an element is present in the DOM.
        """
        return self.wait.until(
            EC.presence_of_element_located(locator)
        )

    def wait_for_element_invisible(self, locator):
        """
        Wait until an element disappears.
        """
        return self.wait.until(
            EC.invisibility_of_element_located(locator)
        )

    def wait_for_title_contains(self, title):
        """
        Wait until the page title contains the given text.
        """
        return self.wait.until(
            EC.title_contains(title)
        )

    def wait_for_url_contains(self, text):
        """
        Wait until the URL contains the given text.
        """
        return self.wait.until(
            EC.url_contains(text)
        )