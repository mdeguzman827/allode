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


def send_tour_request_email(
    property_address: str,
    date_display: str,
    time_display: str,
    contact_email: str,
) -> None:
    """
    Send an email to Allode (allodeinc@gmail.com) that a user wants to tour a property.
    Body includes contact email and the tour request message.
    Raises Exception on failure.
    """
    from_email = os.getenv("DISCLOSURES_FROM_EMAIL", "").strip()
    if not from_email:
        raise ValueError("DISCLOSURES_FROM_EMAIL is not set")

    subject = f"Tour request: {property_address}"
    body = (
        f"Contact: {contact_email}\n\n"
        f"We would like to tour the property at {property_address} on {date_display} at {time_display}."
    )

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


OFFER_TO_EMAIL = "allodeinc@gmail.com"


def send_offer_email(
    property_address: str,
    *,
    listing_id: str = "",
    first_name: str,
    last_name: str,
    email: str,
    phone: str,
    status: str,
    co_buyer: dict | None = None,
    purchase_price: str,
    purchase_price_reasoning: str,
    earnest_money: str,
    escalation_clause: str,
    offer_expiration: str,
    closing_date: str,
    contingency_labels: list[str],
    special_requests: str,
) -> None:
    """
    Send offer form details to Allode (allodeinc@gmail.com).
    co_buyer is optional: dict with first_name, last_name, email, phone.
    listing_id is optional (e.g. MLS/listing number).
    Raises Exception on failure.
    """
    from_email = os.getenv("DISCLOSURES_FROM_EMAIL", "").strip()
    if not from_email:
        raise ValueError("DISCLOSURES_FROM_EMAIL is not set")

    contingencies_str = ", ".join(contingency_labels) if contingency_labels else "None"
    reasoning_block = f"\nReasoning: {purchase_price_reasoning}" if purchase_price_reasoning.strip() else ""
    special_block = f"\n\nSpecial requests:\n{special_requests}" if special_requests.strip() else ""

    co_buyer_block = ""
    if co_buyer and any(co_buyer.get(k) for k in ("first_name", "last_name", "email", "phone")):
        co_buyer_block = f"""
CO-BUYER
First name: {co_buyer.get('first_name', '')}
Last name: {co_buyer.get('last_name', '')}
Email: {co_buyer.get('email', '')}
Phone: {co_buyer.get('phone', '')}
"""

    listing_line = f"Listing ID: {(listing_id or '').strip()}" if (listing_id or "").strip() else ""
    property_block = f"Address: {property_address}" + (f"\n{listing_line}" if listing_line else "")

    body = f"""New offer submission

PROPERTY
{property_block}

PERSONAL INFORMATION
First name: {first_name}
Last name: {last_name}
Email: {email}
Phone: {phone}
Status: {status}{co_buyer_block}

OFFER DETAILS
Purchase price: {purchase_price}
Earnest money deposit: {earnest_money}
Escalation clause: {escalation_clause}
Offer expiration: {offer_expiration}
Closing date: {closing_date}{reasoning_block}

CONTINGENCIES
{contingencies_str}{special_block}
"""

    subject = f"Offer submitted: {property_address}"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = OFFER_TO_EMAIL
    msg.attach(MIMEText(body.strip(), "plain"))

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
        server.sendmail(from_email, [OFFER_TO_EMAIL], msg.as_string())
