import email
import imaplib
import re
import time
from html.parser import HTMLParser

from utils.config_reader import config
from utils.logger import get_logger


logger = get_logger()


class HTMLTextExtractor(HTMLParser):
    """
    Converts HTML content into plain text.
    """

    def __init__(self):
        super().__init__()
        self.text = []

    def handle_data(self, data):
        self.text.append(data)

    def get_text(self):
        return " ".join(self.text)


class OTPReader:
    """
    Reads OTP emails from Gmail using IMAP.
    """

    def __init__(self):
        self.email_id = config.get_value("email")
        self.password = config.get_value("gmail_app_password")
        self.sender = config.get_value("otp_sender")
        self.subject = config.get_value("otp_subject")
        self.wait_time = config.get_value("otp_wait_time")
        self.retry_count = config.get_value("otp_retry_count")

        self.mail = None

    def connect(self):
        """
        Connect to Gmail.
        """
        logger.info("Connecting to Gmail...")

        self.mail = imaplib.IMAP4_SSL("imap.gmail.com")
        self.mail.login(self.email_id, self.password)
        self.mail.select("INBOX")

        logger.info("Connected to Gmail.")

    def disconnect(self):
        """
        Close Gmail connection.
        """
        if self.mail:
            logger.info("Closing Gmail connection.")
            self.mail.logout()

    def get_matching_email_ids(self):
        """
        Returns all matching OTP email IDs.
        """
        status, messages = self.mail.search(
            None,
            f'(FROM "{self.sender}" SUBJECT "{self.subject}")'
        )

        if status != "OK":
            raise Exception("Unable to search Gmail.")

        return messages[0].split()

    def get_latest_email_id(self):
        """
        Returns the latest OTP email ID.
        """
        email_ids = self.get_matching_email_ids()

        if not email_ids:
            return None

        return email_ids[-1]

    def wait_for_new_email(self, previous_email_id):
        """
        Wait until a new OTP email arrives.
        """
        logger.info("Waiting for a new OTP email...")

        for attempt in range(1, self.retry_count + 1):

            self.mail.noop()

            current_email_id = self.get_latest_email_id()

            if (
                current_email_id is not None
                and current_email_id != previous_email_id
            ):
                logger.info("New OTP email received.")
                return current_email_id

            logger.info(
                f"No new email yet. "
                f"Retry {attempt}/{self.retry_count}"
            )

            time.sleep(self.wait_time)

        raise Exception("New OTP email was not received.")

    def fetch_email(self, email_id):
        """
        Fetch an email using its ID.
        """
        status, message_data = self.mail.fetch(
            email_id,
            "(RFC822)"
        )

        if status != "OK":
            raise Exception("Unable to fetch email.")

        raw_email = message_data[0][1]

        return email.message_from_bytes(raw_email)

    def get_email_body(self, message):
        """
        Extract HTML or plain text body.
        """
        if message.is_multipart():

            for part in message.walk():

                content_type = part.get_content_type()
                disposition = str(part.get("Content-Disposition"))

                if (
                    content_type == "text/html"
                    and "attachment" not in disposition
                ):
                    return part.get_payload(
                        decode=True
                    ).decode(errors="ignore")

                if (
                    content_type == "text/plain"
                    and "attachment" not in disposition
                ):
                    return part.get_payload(
                        decode=True
                    ).decode(errors="ignore")

        return message.get_payload(
            decode=True
        ).decode(errors="ignore")

    def html_to_text(self, html):
        """
        Convert HTML into plain text.
        """
        parser = HTMLTextExtractor()
        parser.feed(html)

        text = parser.get_text()

        text = re.sub(r"\s+", " ", text)

        return text.strip()

    def extract_otp(self, body):
        """
        Extract the OTP from the email body.
        """
        plain_text = self.html_to_text(body)

        pattern = r"Here is your OTP code:\s*(\d{6})"

        match = re.search(
            pattern,
            plain_text,
            re.IGNORECASE
        )

        if match:
            logger.info("OTP extracted successfully.")
            return match.group(1)

        match = re.search(r"\b\d{6}\b", plain_text)

        if match:
            logger.info("OTP extracted using fallback.")
            return match.group()

        raise Exception("OTP not found.")

    def wait_for_new_otp(self, previous_email_id):
        """
        Wait for a new OTP email and return the OTP.
        """
        new_email_id = self.wait_for_new_email(
            previous_email_id
        )

        message = self.fetch_email(new_email_id)

        body = self.get_email_body(message)

        otp = self.extract_otp(body)

        logger.info(f"Retrieved OTP: {otp}")

        return otp