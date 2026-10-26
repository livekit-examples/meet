from conftest import interview_data
from pages.interview_details_page import InterviewDetailsPage
from pages.interview_generation_page import InterviewGenerationPage
from pages.interview_sets_page import InterviewSetsPage
from pages.interview_settings_page import InterviewSettingsPage
from pages.jobs_page import JobsPage
from pages.login_page import LoginPage


def test_create_interview(driver,interview_data):
    """
    Verify interview creation.
    """

    login_page = LoginPage(driver)
    jobs_page = JobsPage(driver)
    interview_sets_page = InterviewSetsPage(driver)
    interview_details_page = InterviewDetailsPage(driver)
    interview_settings_page = InterviewSettingsPage(driver)
    interview_generation_page = InterviewGenerationPage(driver)

    role = interview_data["role"]
    timestamp = interview_data["timestamp"]


    # Login
    login_page.login()

    # Dashboard
    assert jobs_page.verify_page_loaded()

    # Open Interview Sets
    jobs_page.click_interviews()

    assert interview_sets_page.verify_page_loaded()

    # Create Interview Set
    interview_sets_page.click_create_set()

    role = interview_data["role"]
 
    # Step 1 - Interview Details
    interview_details_page.fill_interview_details(role)

    # Step 2 - Interview Settings
    interview_settings_page.configure_interview()

    # Step 3 - Generate & Save
    interview_generation_page.generate_interview()


    result_page = InterviewResultPage(driver)

    timestamp = result_page.get_timestamp()

    update_timestamp(timestamp)

    # Verify user is back on Interview Sets page
    assert interview_sets_page.verify_page_loaded()