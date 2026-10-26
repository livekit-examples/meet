from utils.otp_reader import get_latest_otp

try:
    otp = get_latest_otp()
    print(f"\nOTP Received: {otp}")

except Exception as error:
    print(f"\nError: {error}")