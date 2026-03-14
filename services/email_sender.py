"""
Send transactional emails (e.g. disclosures) via SMTP.
Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and DISCLOSURES_FROM_EMAIL in .env.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def is_email_configured() -> bool:
    """Return True if SMTP and from-address are configured."""
    return bool(
        os.getenv("SMTP_HOST")
        and os.getenv("SMTP_USER")
        and os.getenv("SMTP_PASSWORD")
        and os.getenv("DISCLOSURES_FROM_EMAIL")
    )


def send_disclosures_email(to_email: str, property_address: str) -> None:
    """
    Send a plain-text email to the given address with the disclosures message.
    Raises Exception on failure.
    """
    from_email = os.getenv("DISCLOSURES_FROM_EMAIL", "").strip()
    if not from_email:
        raise ValueError("DISCLOSURES_FROM_EMAIL is not set")

    subject = f"Disclosures for {property_address}"
    body = f"Please see disclosures for {property_address}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))

    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")

    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")

    with smtplib.SMTP(host, port) as server:
        if use_tls:
            server.starttls()
        if user and password:
            server.login(user, password)
        server.sendmail(from_email, [to_email], msg.as_string())


TOUR_REQUEST_TO_EMAIL = "allodeinc@gmail.com"


def send_tour_request_email(property_address: str, date_display: str, time_display: str) -> None:
    """
    Send an email to Allode (allodeinc@gmail.com) that a user wants to tour a property.
    Message: "We would like to tour the property at {property_address}, {date_display}, {time_display}."
    Raises Exception on failure.
    """
    from_email = os.getenv("DISCLOSURES_FROM_EMAIL", "").strip()
    if not from_email:
        raise ValueError("DISCLOSURES_FROM_EMAIL is not set")

    subject = f"Tour request: {property_address}"
    body = f"We would like to tour the property at {property_address} on {date_display} at {time_display}."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = TOUR_REQUEST_TO_EMAIL
    msg.attach(MIMEText(body, "plain"))

    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")

    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")

    with smtplib.SMTP(host, port) as server:
        if use_tls:
            server.starttls()
        if user and password:
            server.login(user, password)
        server.sendmail(from_email, [TOUR_REQUEST_TO_EMAIL], msg.as_string())
