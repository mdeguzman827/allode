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

    subject = "Disclosures"
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
