import os
import time
import requests
import argparse
from urllib.parse import urljoin
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def login_nwmls(mls_number, username=None, password=None):
    """
    Log into nwmls.com using Selenium
    
    Args:
        username: NWMLS username (if None, will use env var NWMLS_USERNAME)
        password: NWMLS password (if None, will use env var NWMLS_PASSWORD)
    
    Returns:
        driver: Selenium WebDriver instance if login successful, None otherwise
    """
    # Get credentials from environment variables
    if not username:
        username = os.getenv("NWMLS_USERNAME")
        if not username:
            raise ValueError("NWMLS_USERNAME environment variable is not set")
    
    if not password:
        password = os.getenv("NWMLS_PASSWORD")
        if not password:
            raise ValueError("NWMLS_PASSWORD environment variable is not set")
    
    # Set up Chrome options
    chrome_options = Options()
    # Uncomment the next line to run in headless mode (no browser window)
    # chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Initialize the driver
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Navigate to NWMLS login page
        print("Navigating to matrix.nwmls.com...")
        driver.get("https://www.matrix.nwmls.com/Matrix/Home/")
        
        # Wait for page to load
        wait = WebDriverWait(driver, 15)
        time.sleep(3)  # Give page time to fully load
        
        # Check for iframes (some login forms are in iframes)
        in_iframe = False
        iframes = driver.find_elements(By.TAG_NAME, "iframe")
        if iframes:
            print(f"Found {len(iframes)} iframe(s), checking for login form inside...")
            for iframe in iframes:
                try:
                    driver.switch_to.frame(iframe)
                    # Try to find login fields in iframe
                    try:
                        test_fields = driver.find_elements(By.CSS_SELECTOR, "input[type='text'], input[type='email'], input[type='password']")
                        if test_fields:
                            print("Found login form in iframe")
                            in_iframe = True
                            break
                    except:
                        driver.switch_to.default_content()
                        continue
                except:
                    driver.switch_to.default_content()
                    continue
        
        # If we didn't find form in iframe, make sure we're in default content
        if not in_iframe:
            try:
                driver.switch_to.default_content()
            except:
                pass
        
        # Wait for login form to appear and be ready
        print("Waiting for login form to load...")
        time.sleep(2)
        
        username_field = find_field(driver, wait, field_type="username")

        # Find password field with multiple strategies
        print("Searching for password field...")
        password_selectors = [
            "input[type='password']",
            "input[name='password']",
            "input[name='pass']",
            "input[id*='password' i]",
            "input[id*='pass' i]",
            "input[placeholder*='password' i]",
            "input[placeholder*='pass' i]",
            "input[class*='password' i]"
        ]
        
        password_field = None
        for selector in password_selectors:
            try:
                password_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                if password_field and password_field.is_displayed() and password_field.is_enabled():
                    print(f"Found password field using selector: {selector}")
                    break
            except:
                continue
        
        if not password_field:
            # Try XPath
            try:
                password_field = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='password']")))
                print("Found password field using XPath")
            except:
                print("Error: Could not find password field")
                driver.quit()
                return None
        

        # Wait for fields to be interactable
        wait.until(EC.element_to_be_clickable(username_field))
        wait.until(EC.element_to_be_clickable(password_field))
        
        # Enter credentials
        print("Entering credentials...")
        try:
            # Scroll to field if needed
            driver.execute_script("arguments[0].scrollIntoView(true);", username_field)
            time.sleep(0.5)
            
            # Clear and enter username
            username_field.click()
            time.sleep(0.3)
            username_field.clear()
            time.sleep(0.3)
            username_field.send_keys(username)
            print(f"Entered username: {username}")
            time.sleep(0.5)
            
            # Scroll to password field if needed
            driver.execute_script("arguments[0].scrollIntoView(true);", password_field)
            time.sleep(0.5)
            
            # Clear and enter password
            password_field.click()
            time.sleep(0.3)
            password_field.clear()
            time.sleep(0.3)
            password_field.send_keys(password)
            print("Entered password: ***")
            time.sleep(0.5)
        except Exception as e:
            print(f"Error entering credentials: {e}")
            driver.quit()
            return None
        
        # Verify fields were filled
        username_value = username_field.get_attribute('value')
        password_value = password_field.get_attribute('value')
        
        if not username_value or username_value != username:
            print(f"Warning: Username field value mismatch. Expected: {username}, Got: {username_value}")
            # Try JavaScript to set value
            driver.execute_script("arguments[0].value = arguments[1];", username_field, username)
            time.sleep(0.3)
        
        if not password_value:
            print("Warning: Password field appears empty, trying JavaScript...")
            driver.execute_script("arguments[0].value = arguments[1];", password_field, password)
            time.sleep(0.3)
        

        click_button(driver, wait, action="Log In", password_field=password_field)
        print("Waiting for login to complete...")
        time.sleep(3)

        # Clicking read later buttons
        click_button(driver, wait, action="Read Later")
        print("Waiting for Read Later to complete...")
        time.sleep(3)

        # Clicking read later buttons
        click_button(driver, wait, action="Read Later")
        print("Waiting for Read Later to complete...")
        time.sleep(3)

        # Search MLS for property
        mls_number_field = find_field(driver, wait, field_type="mls_number")
        mls_number_field.click()
        time.sleep(0.3)
        mls_number_field.clear()
        time.sleep(0.3)
        mls_number_field.send_keys(mls_number)
        print(f"Entered mls_number: {mls_number}")
        time.sleep(0.5)

        click_button(driver, wait, action="Search MLS")
        print("Waiting for Search MLS to complete...")
        time.sleep(3)

        click_button(driver, wait, action="Click MLS", mls_number=mls_number)
        print("Waiting for Click MLS to complete...")
        time.sleep(3)

        click_button(driver, wait, action="To Supplements")
        print("Waiting for To Supplements to complete...")
        time.sleep(3)

        # Collect all supplement links
        supplement_links = collect_supplement_links(driver, wait)

        # Check if login was successful
        current_url = driver.current_url
        page_source = driver.page_source.lower()
        
        # Check for indicators of successful login
        if 'logout' in page_source or 'sign out' in page_source or 'dashboard' in page_source:
            print("✓ Login successful!")
            return driver
        elif 'login' in current_url.lower() and 'error' in page_source:
            print("✗ Login failed - check credentials")
            driver.quit()
            return None
        else:
            print("Login status unclear. Current URL:", current_url)
            print("You may need to verify manually.")
            return driver
        
    except Exception as e:
        print(f"Error during login: {str(e)}")
        if 'driver' in locals():
            driver.quit()
        return None

# Function to click a button based on the action
def click_button(driver, wait, action, password_field=None, mls_number=None):

    # Log In
    log_in_selectors = [
            "button[type='submit']",
            "input[type='submit']",
            "button[class*='submit' i]",
            "button[class*='login' i]",
            "button[class*='sign' i]",
            "input[value*='Login' i]",
            "input[value*='Sign' i]",
            "input[value*='Submit' i]",
            "button[contains(text(), 'Login')]",
            "button[contains(text(), 'Sign')]",
            "button[contains(text(), 'Submit')]"
        ]

    log_in_xpath_selectors = [
            "//button[@type='submit']",
            "//input[@type='submit']",
            "//button[contains(text(), 'Login')]",
            "//button[contains(text(), 'Sign In')]",
            "//button[contains(text(), 'Submit')]"
        ]

    # Read Later
    read_later_selectors = [
        "button[class*='btn btn-secondary ms-1' i]",
        "button[contains(text(), 'Read')]",
        "button[contains(text(), 'Later')]",
        "button[contains(text(), 'Submit')]"
    ]

    read_later_xpath_selectors = [
        "//button[contains(text(), 'Read')]",
        "//button[contains(text(), 'Later')]",
        "//button[contains(text(), 'Submit')]"
    ]
    
    # Search MLS
    search_mls_selectors = [
        "button[class*='btn btn-primary' i]",
        "button[name='MagnifyingGlass']",
        "button[type='submit']",
    ]

    search_mls_xpath_selectors = [
        "//button[contains(text(), 'Search')]",
        "//button[contains(text(), 'Submit')]"
    ]

    # Click MLS
    click_mls_selectors = [
        "a[data-mtx-track='Results - In-Display Full Link Click']",
        "a[data-mtx-track*='Full Link Click']",
        "a[data-mtx-track*='In-Display']"
    ]
    
    click_mls_xpath_selectors = [
        "//a[matches(text(), '^\\d{6,}$')]",
        "//a[number(text()) > 0]"
    ]

    # To Supplements
    to_supplements_selectors = [
        "a[data-mtx-track*='Query Link Click']",  # Primary
        "a[data-original-title='To Supplements']",  # By title
        "a[href*='ITQPopup']",  # By JavaScript function
    ]
    
    to_supplements_xpath_selectors = [
        "//a[@data-mtx-track*='Query Link Click' and contains(@href, 'ITQPopup')]",
        "//a[@data-original-title='To Supplements']",
        "//a[img[@src*='paper_stack.gif']]",
    ]

    # Click button based on action
    if action == "Log In":
        selectors = log_in_selectors
        xpath_selectors = log_in_xpath_selectors
    elif action == "Read Later":
        selectors = read_later_selectors
        xpath_selectors = read_later_xpath_selectors
    elif action == "Search MLS":
        selectors = search_mls_selectors
        xpath_selectors = search_mls_xpath_selectors
    elif action == "Click MLS":
        selectors = click_mls_selectors
        xpath_selectors = click_mls_xpath_selectors
    elif action == "To Supplements":
        selectors = to_supplements_selectors
        xpath_selectors = to_supplements_xpath_selectors

    # Find and click submit button
    print("Looking for button...")

    submit_button = None
    for selector in selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            for elem in elements:
                if elem.is_displayed() and elem.is_enabled():
                    submit_button = elem
                    print(f"Found button using selector: {selector}")
                    break
            if submit_button:
                break
        except:
            continue
    
    # Try XPath for submit button
    if not submit_button:
        for xpath in xpath_selectors:
            try:
                elements = driver.find_elements(By.XPATH, xpath)
                for elem in elements:
                    if elem.is_displayed() and elem.is_enabled():
                        submit_button = elem
                        print(f"Found button using XPath: {xpath}")
                        break
                if submit_button:
                    break
            except:
                continue
    
    # click the button
    if submit_button:
        try:
            # Scroll to button
            driver.execute_script("arguments[0].scrollIntoView(true);", submit_button)
            time.sleep(0.5)
            wait.until(EC.element_to_be_clickable(submit_button))
            submit_button.click()
            print("Clicked submit button")
        except Exception as e:
            print(f"Error clicking submit button: {e}, trying JavaScript click...")
            driver.execute_script("arguments[0].click();", submit_button)
    else:
        print("Button not found, trying to submit form via Enter key or form submission...")
        # Try pressing Enter on password field
        try:
            password_field.submit()
            print("Submitted form via password field")
        except:
            # Try JavaScript form submission
            try:
                form = password_field.find_element(By.XPATH, "./ancestor::form")
                driver.execute_script("arguments[0].submit();", form)
                print("Submitted form via JavaScript")
            except:
                print("Could not submit form automatically")

# Function to find a field based on the field type
def find_field(driver, wait, field_type):
    
    # Find username/email field with multiple strategies
    username_selectors = [
        "input[name='username']",
        "input[name='user']",
        "input[name='userid']",
        "input[name='userId']",
        "input[name='email']",
        "input[type='text']",
        "input[type='email']",
        "input[id*='username' i]",
        "input[id*='user' i]",
        "input[id*='email' i]",
        "input[id*='login' i]",
        "input[placeholder*='username' i]",
        "input[placeholder*='user' i]",
        "input[placeholder*='email' i]",
        "input[placeholder*='login' i]",
        "input[class*='username' i]",
        "input[class*='user' i]",
        "input[class*='email' i]"
    ]

    username_xpath_selectors = [
        "//input[@type='text']",
        "//input[@type='email']",
        "//input[contains(@name, 'user')]",
        "//input[contains(@id, 'user')]",
        "//input[contains(@placeholder, 'user')]",
        "//input[contains(@placeholder, 'email')]"
    ]

    # Find mls_number field with multiple strategies
    mls_number_selectors = [
        "input[name='QueryText']",
        "input[type='text']",
        "input[id*='QueryText' i]",
        "input[placeholder*='QueryText' i]",
        "input[class*='form-control' i]"
    ]

    mls_number_xpath_selectors = [
        "//input[@type='text']",
        "//input[contains(@name, 'QueryText')]",
        "//input[contains(@id, 'QueryText')]",
        "//input[contains(@placeholder, 'QueryText')]",
        "//input[contains(@placeholder, 'QueryText')]"
    ]

    if field_type == "username":
        selectors = username_selectors
        xpath_selectors = username_xpath_selectors
    elif field_type == "mls_number":
        selectors = mls_number_selectors
        xpath_selectors = mls_number_xpath_selectors


    field = None
    print(f"Searching for {field_type} field...")
    for selector in selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            for elem in elements:
                # Check if element is visible and interactable
                if elem.is_displayed() and elem.is_enabled():
                    # Make sure it's not the password field
                    if elem.get_attribute('type') != 'password':
                        field = elem
                        print(f"Found username field using selector: {selector}")
                        break
            if field:
                break
        except Exception as e:
            continue
    
    # If still not found, try XPath
    if not field:
        print("Trying XPath selectors...")

        if field_type == "username":
            xpath_selectors = username_xpath_selectors
        elif field_type == "mls_number":
            xpath_selectors = mls_number_xpath_selectors


        for xpath in xpath_selectors:
            try:
                elements = driver.find_elements(By.XPATH, xpath)
                for elem in elements:
                    if elem.is_displayed() and elem.is_enabled() and elem.get_attribute('type') != 'password':
                        field = elem
                        print(f"Found {field_type} field using XPath: {xpath}")
                        break
                if field:
                    break
            except:
                continue
    
    if not field:
        print(f"Error: Could not find {field_type} field")
        print("Current URL:", driver.current_url)
        print("Page title:", driver.title)
        # Print all input fields found
        all_inputs = driver.find_elements(By.TAG_NAME, "input")
        print(f"\nFound {len(all_inputs)} input field(s) on page:")
        for i, inp in enumerate(all_inputs):
            print(f"  Input {i+1}: type={inp.get_attribute('type')}, name={inp.get_attribute('name')}, id={inp.get_attribute('id')}, placeholder={inp.get_attribute('placeholder')}")
        driver.quit()
        return None    

    return field

def collect_supplement_links(driver, wait=None):
    """
    Collect all href links and their names from the supplements page.
    This function should be called after clicking the "To Supplements" button.
    Excludes the "Close" button from the results.
    
    Args:
        driver: Selenium WebDriver instance
        wait: WebDriverWait instance (optional, will create if not provided)
    
    Returns:
        list: List of dictionaries with 'name' and 'href' keys for each link
              Example: [{'name': 'Document 1', 'href': 'https://...'}, ...]
    """
    if wait is None:
        from selenium.webdriver.support.ui import WebDriverWait
        wait = WebDriverWait(driver, 15)
    
    # Wait for the supplements page to load
    print("Waiting for supplements page to load...")
    time.sleep(2)  # Give page time to load
    
    # Check if we need to switch to a popup/iframe
    # Supplements might open in a popup window or iframe
    supplement_links = []
    
    try:
        # First, check if there's a popup window
        main_window = driver.current_window_handle
        all_windows = driver.window_handles
        
        if len(all_windows) > 1:
            # Switch to the new popup window
            for window in all_windows:
                if window != main_window:
                    driver.switch_to.window(window)
                    print("Switched to popup window")
                    break
        
        # Check for iframes (supplements might be in an iframe)
        iframes = driver.find_elements(By.TAG_NAME, "iframe")
        in_iframe = False
        
        if iframes:
            print(f"Found {len(iframes)} iframe(s), checking for links inside...")
            for iframe in iframes:
                try:
                    driver.switch_to.frame(iframe)
                    in_iframe = True
                    print("Switched to iframe")
                    break
                except:
                    continue
        
        # Wait for links to be present
        time.sleep(1)
        
        # Find all anchor tags (links) on the page
        print("Collecting all links from supplements page...")
        all_links = driver.find_elements(By.TAG_NAME, "a")
        
        # Also try finding links by common selectors for document links
        additional_selectors = [
            "a[href*='.pdf']",
            "a[href*='.doc']",
            "a[href*='.docx']",
            "a[href*='download']",
            "a[href*='Document']",
            "a[href*='Supplement']",
        ]
        
        for selector in additional_selectors:
            try:
                links_by_selector = driver.find_elements(By.CSS_SELECTOR, selector)
                for link in links_by_selector:
                    if link not in all_links:
                        all_links.append(link)
            except:
                continue
        
        # Extract href and name for each link
        for link in all_links:
            try:
                href = link.get_attribute('href')
                # Get the link text/name
                name = link.text.strip()
                
                # If no text, try to get from title, alt, or other attributes
                if not name:
                    name = link.get_attribute('title') or \
                           link.get_attribute('alt') or \
                           link.get_attribute('data-original-title') or \
                           link.get_attribute('aria-label') or \
                           ''
                
                # Skip Close buttons - check various ways Close button might be identified
                name_lower = name.lower()
                is_close_button = (
                    name_lower == 'close' or
                    'close' in name_lower or
                    link.get_attribute('class') and 'close' in link.get_attribute('class').lower() or
                    link.get_attribute('id') and 'close' in link.get_attribute('id').lower() or
                    link.get_attribute('onclick') and 'close' in link.get_attribute('onclick').lower() or
                    (href and ('close' in href.lower() or 'javascript:void' in href.lower() or href.lower().startswith('javascript:')))
                )
                
                if is_close_button:
                    print(f"Skipping Close button: {name}")
                    continue
                
                # Only add links that have an href
                if href and href.strip():
                    # Make href absolute if it's relative
                    if not href.startswith('http'):
                        from urllib.parse import urljoin
                        href = urljoin(driver.current_url, href)
                    
                    supplement_links.append({
                        'name': name if name else 'Unnamed Link',
                        'href': href
                    })
            except Exception as e:
                print(f"Error extracting link: {e}")
                continue
        
        # Switch back to default content if we were in an iframe
        if in_iframe:
            driver.switch_to.default_content()
            print("Switched back to default content")
        
        # Switch back to main window if we switched to popup
        if len(all_windows) > 1:
            driver.switch_to.window(main_window)
            print("Switched back to main window")
        
        print(f"✓ Collected {len(supplement_links)} supplement links")
        
        # Print summary
        if supplement_links:
            print("\nCollected links:")
            for i, link_info in enumerate(supplement_links, 1):
                print(f"  {i}. {link_info['name']}: {link_info['href']}")
        else:
            print("⚠ No links found on supplements page")
        
        return supplement_links
        
    except Exception as e:
        print(f"Error collecting supplement links: {e}")
        # Make sure we're back to default content
        try:
            driver.switch_to.default_content()
            if len(driver.window_handles) > 1:
                driver.switch_to.window(driver.window_handles[0])
        except:
            pass
        return []


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract documents from NWMLS')
    parser.add_argument('mls_number', type=str, help='MLS number to search for')
    args = parser.parse_args()
    
    print("=" * 60)
    print("Logging into NWMLS...")
    print(f"MLS Number: {args.mls_number}")
    print("=" * 60)
    
    driver = login_nwmls(args.mls_number)