from pages.interview_sets_page import InterviewSetsPage
from pages.jobs_page import JobsPage
from pages.login_page import LoginPage


def test_login(driver):
    """
    Verify user can log in successfully.
    """

    login_page = LoginPage(driver)
    jobs_page = JobsPage(driver)
    interview_sets_page = InterviewSetsPage(driver)

    login_page.login()

    assert jobs_page.verify_page_loaded()

    jobs_page.click_interviews()

    assert interview_sets_page.verify_page_loaded()