"""
UniSmart VTU Result Scraper Service - CORRECTED VERSION
Based on your working script with proper VTU portal compatibility
"""

import time
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from decimal import Decimal

import cv2
import numpy as np
import easyocr
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

from django.db import transaction
from .models import (
    Student, Subject, StudentResult, Department,
    SemesterSubject, ScrapeLog, User, SystemSettings
)

logger = logging.getLogger('scraper')


class VTUScraperException(Exception):
    """Custom exception for VTU scraper errors."""
    pass


class VTUResultScraper:
    """
    VTU Result Scraper - Compatible with VTU portal structure
    Based on proven working implementation
    """

    def __init__(self, headless: bool = True, max_captcha_attempts: int = 5):
        self.headless = headless
        self.max_captcha_attempts = max_captcha_attempts
        self.driver = None
        self.ocr_reader = None

        # Get VTU URL from database settings
        self.VTU_RESULTS_URL = SystemSettings.get_setting(
            'VTU_RESULTS_URL',
            default='https://results.vtu.ac.in/JJEcbcs25/index.php'
        )

        logger.info(f"Initializing VTU Result Scraper with URL: {self.VTU_RESULTS_URL}")
    
    def __enter__(self):
        """Context manager entry"""
        self._initialize_browser()
        self._initialize_ocr()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.cleanup()
    
    def _initialize_browser(self):
        """Initialize Selenium WebDriver"""
        try:
            logger.info("Initializing Chrome WebDriver")
            chrome_options = Options()
            
            if self.headless:
                chrome_options.add_argument("--headless=new")
            
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--window-size=1920,1080")
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            logger.info("Chrome WebDriver initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize WebDriver: {e}")
            raise VTUScraperException(f"Browser initialization failed: {e}")
    
    def _initialize_ocr(self):
        """Initialize EasyOCR reader"""
        try:
            logger.info("Initializing EasyOCR reader...")
            self.ocr_reader = easyocr.Reader(['en'], verbose=False, gpu=False)
            logger.info("EasyOCR reader initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OCR: {e}")
            raise VTUScraperException(f"OCR initialization failed: {e}")
    
    def _extract_captcha_text(self, captcha_image_bytes: bytes) -> str:
        """
        Extract text from CAPTCHA image using EasyOCR
        
        Args:
            captcha_image_bytes: Raw image bytes
            
        Returns:
            Extracted CAPTCHA text
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(captcha_image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                logger.warning("Failed to decode CAPTCHA image")
                return ""
            
            # Convert to grayscale
            gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply threshold
            _, processed_image = cv2.threshold(gray_image, 120, 255, cv2.THRESH_BINARY_INV)
            
            logger.info("Reading text from processed CAPTCHA image...")
            allowed_chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
            results = self.ocr_reader.readtext(
                processed_image,
                detail=0,
                allowlist=allowed_chars
            )
            
            captcha_text = "".join(results).strip().replace(" ", "")
            logger.info(f"Extracted CAPTCHA text: {captcha_text}")
            return captcha_text
            
        except Exception as e:
            logger.error(f"CAPTCHA extraction failed: {e}")
            return ""
    
    def _solve_captcha_and_login(self, usn: str) -> bool:
        """
        Solve CAPTCHA and submit USN
        
        Args:
            usn: University Seat Number
            
        Returns:
            True if login successful, False otherwise
        """
        for attempt in range(self.max_captcha_attempts):
            try:
                logger.info(f"CAPTCHA attempt {attempt + 1}/{self.max_captcha_attempts} for USN: {usn}")
                
                # Wait for CAPTCHA image (using correct VTU structure)
                wait = WebDriverWait(self.driver, 20)
                captcha_img_element = wait.until(
                    EC.presence_of_element_located(
                        (By.XPATH, "//img[contains(@src,'vtu_captcha.php')]")
                    )
                )
                time.sleep(0.5)
                
                # Screenshot CAPTCHA
                captcha_screenshot = captcha_img_element.screenshot_as_png
                captcha_text = self._extract_captcha_text(captcha_screenshot)
                
                if not captcha_text:
                    logger.warning("Could not extract CAPTCHA text. Retrying...")
                    self.driver.refresh()
                    time.sleep(1)
                    continue
                
                logger.info(f"Extracted CAPTCHA: {captcha_text}")
                
                # Fill USN field
                usn_field = self.driver.find_element(By.NAME, "lns")
                usn_field.clear()
                usn_field.send_keys(usn)
                
                # Fill CAPTCHA field
                captcha_field = self.driver.find_element(By.NAME, "captchacode")
                captcha_field.clear()
                captcha_field.send_keys(captcha_text)
                
                # Submit
                submit_button = self.driver.find_element(By.ID, "submit")
                submit_button.click()
                
                # Check for alert (login failure)
                try:
                    WebDriverWait(self.driver, 3).until(EC.alert_is_present())
                    alert = self.driver.switch_to.alert
                    alert_text = alert.text
                    logger.warning(f"Login failed: {alert_text}")
                    alert.accept()
                    time.sleep(1)
                    continue
                except TimeoutException:
                    # No alert = success
                    logger.info("Login successful, proceeding to scrape results")
                    return True
                    
            except Exception as e:
                logger.error(f"Error on attempt {attempt + 1}: {e}")
                if attempt < self.max_captcha_attempts - 1:
                    self.driver.refresh()
                    time.sleep(2)
                continue
        
        logger.error(f"Failed to solve CAPTCHA after {self.max_captcha_attempts} attempts")
        return False
    
    def _parse_result_page(self) -> Optional[Dict]:
        """
        Parse the result page and extract data
        
        Returns:
            Dictionary with student info and results
        """
        try:
            logger.info("Checking for results page...")
            
            # Wait for student name element (indicates results loaded)
            wait = WebDriverWait(self.driver, 10)
            wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, "//td[contains(b, 'Student Name')]")
                )
            )
            logger.info("Results page loaded successfully. Scraping data...")
            
            # Extract student information
            student_name_xpath = "//td[contains(b, 'Student Name')]/following-sibling::td[1]"
            usn_xpath = "//td[contains(b, 'University Seat Number')]/following-sibling::td[1]"
            semester_xpath = "//div[contains(b, 'Semester')]"
            
            student_name = self.driver.find_element(By.XPATH, student_name_xpath).text.replace(":", "").strip()
            usn = self.driver.find_element(By.XPATH, usn_xpath).text.replace(":", "").strip().upper()
            semester_text = self.driver.find_element(By.XPATH, semester_xpath).text.replace(":", "").replace("Semester", "").strip()
            
            try:
                semester = int(semester_text)
            except ValueError:
                logger.warning(f"Could not parse semester: {semester_text}, defaulting to 1")
                semester = 1
            
            logger.info(f"Parsing results for {student_name} ({usn}) - Semester {semester}")
            
            # Extract result rows
            rows = self.driver.find_elements(
                By.XPATH,
                "//div[@class='divTableBody']/div[@class='divTableRow'][position()>1]"
            )

            results_data = []
            for row in rows:
                cells = row.find_elements(By.CLASS_NAME, "divTableCell")
                if len(cells) >= 6:
                    subject_code = cells[0].text.strip()
                    subject_name = cells[1].text.replace('\n', ' ').strip()
                    internal_str = cells[2].text.strip()
                    external_str = cells[3].text.strip()
                    total_str = cells[4].text.strip()
                    result_str = cells[5].text.strip()
                    date_str = cells[6].text.strip() if len(cells) > 6 else ''

                    # Parse marks (handle non-numeric values)
                    def parse_marks(mark_str):
                        try:
                            return int(mark_str) if mark_str.isdigit() else 0
                        except:
                            return 0

                    internal_marks = parse_marks(internal_str)
                    external_marks = parse_marks(external_str)
                    total_marks = parse_marks(total_str)

                    # Parse announced date
                    announced_date = None
                    if date_str:
                        try:
                            # Try common date formats
                            for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y']:
                                try:
                                    announced_date = datetime.strptime(date_str, fmt).date()
                                    break
                                except:
                                    continue
                        except:
                            pass

                    # CRITICAL: Use VTU's result status from portal
                    # DO NOT calculate pass/fail here - respect VTU's decision
                    result_status = 'P'  # Default to Pass

                    if 'F' in result_str.upper() or 'FAIL' in result_str.upper():
                        result_status = 'F'
                    elif 'A' in result_str.upper() or 'AB' in result_str.upper():
                        result_status = 'A'  # Absent
                    elif 'W' in result_str.upper():
                        result_status = 'W'  # Withheld
                    elif 'X' in result_str.upper() or 'NE' in result_str.upper():
                        result_status = 'X'  # Not Eligible
                    # else: Keep as 'P' (Pass)

                    results_data.append({
                        'code': subject_code,
                        'name': subject_name,
                        'internal': internal_marks,
                        'external': external_marks,
                        'total': total_marks,
                        'result': result_status,
                        'announced_date': announced_date
                    })
            
            if not results_data:
                logger.warning("No result rows found")
                return None
            
            parsed_data = {
                'student_name': student_name,
                'usn': usn,
                'semester': semester,
                'subjects': results_data
            }
            
            logger.info(f"Successfully parsed {len(results_data)} subject results")
            return parsed_data
            
        except NoSuchElementException as e:
            logger.error(f"Element not found while parsing: {e}")
            return None
        except Exception as e:
            logger.error(f"Error parsing result page: {e}")
            return None
    
    @transaction.atomic
    def _save_to_database(self, result_data: Dict, initiated_by: User) -> Tuple[int, int]:
        """
        Save scraped results to database
        
        Args:
            result_data: Parsed result data
            initiated_by: User who initiated scrape
            
        Returns:
            Tuple of (records_created, records_updated)
        """
        logger.info("Saving results to database...")
        
        records_created = 0
        records_updated = 0
        
        try:
            usn = result_data['usn']
            student_name = result_data['student_name']
            semester = result_data['semester']
            
            # Extract department code from USN (e.g., 2AB22CS008 -> CS)
            dept_code = usn[5:7] if len(usn) >= 7 else "XX"
            
            # Get or create department
            department, _ = Department.objects.get_or_create(
                code=dept_code,
                defaults={
                    'name': f'{dept_code} Department',
                    'is_active': True
                }
            )
            
            # Get or create user for student
            username = usn.lower()
            user, user_created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{usn.lower()}@student.vtu.ac.in",
                    'role': 'STUDENT'
                }
            )
            
            if user_created:
                user.set_password(usn)  # Default password is USN
                user.save()
                logger.info(f"Created user account for {usn}")
            
            # Get or create student
            student, student_created = Student.objects.get_or_create(
                usn=usn,
                defaults={
                    'user': user,
                    'name': student_name,
                    'department': department,
                    'current_semester': semester,
                    'batch': usn[3:5] if len(usn) >= 5 else '22',
                    'admission_year': 2000 + int(usn[3:5]) if len(usn) >= 5 else 2022,
                    'email': f"{usn.lower()}@student.vtu.ac.in",
                    'is_active': True
                }
            )
            
            if student_created:
                records_created += 1
                logger.info(f"Created student: {usn}")
            else:
                records_updated += 1
            
            # Process each subject result
            for subject_data in result_data['subjects']:
                subject_code = subject_data['code']
                subject_name = subject_data['name']

                # Determine subject type and marks distribution based on code/name patterns
                subject_type = 'THEORY'  # Default
                max_internal = 20
                max_external = 80
                max_total = 100
                credits = 4  # Default for theory

                # Detect LAB subjects
                if 'LAB' in subject_code.upper() or 'L' in subject_code[-2:]:
                    subject_type = 'LAB'
                    max_internal = 20
                    max_external = 80
                    max_total = 100
                    credits = 2

                # Detect PROJECT subjects
                elif 'PROJECT' in subject_name.upper() or subject_code.endswith('85'):
                    subject_type = 'PROJECT'
                    max_internal = 0  # Projects often have 0 internal
                    max_external = 100
                    max_total = 100
                    credits = 1

                # Detect Audit Courses (have credits but don't count in CGPA)
                elif any(keyword in subject_name.upper() for keyword in ['ENVIRONMENTAL', 'CONSTITUTION', 'PROFESSIONAL ETHICS', 'HUMAN RIGHTS']):
                    subject_type = 'AUDIT'
                    max_internal = 100
                    max_external = 0
                    max_total = 100
                    credits = 1  # Audit courses typically have 1 credit

                elif any(keyword in subject_code.upper() for keyword in ['BES', 'BCIV']):
                    subject_type = 'AUDIT'
                    max_internal = 100
                    max_external = 0
                    max_total = 100
                    credits = 1

                # Detect Non-Credit Mandatory Courses (0 credits)
                elif any(keyword in subject_name.upper() for keyword in ['YOGA', 'PHYSICAL EDUCATION', 'IKS', 'INDIAN KNOWLEDGE']):
                    subject_type = 'NON_CREDIT'
                    max_internal = 100
                    max_external = 0
                    max_total = 100
                    credits = 0

                elif any(keyword in subject_code.upper() for keyword in ['BYOK', 'BIKS']):
                    subject_type = 'NON_CREDIT'
                    max_internal = 100
                    max_external = 0
                    max_total = 100
                    credits = 0

                # Detect INTERNSHIP
                elif 'INTERNSHIP' in subject_name.upper() or 'INTERN' in subject_code.upper():
                    subject_type = 'INTERNSHIP'
                    max_internal = 0
                    max_external = 100
                    max_total = 100
                    credits = 2

                # Detect SEMINAR
                elif 'SEMINAR' in subject_name.upper():
                    subject_type = 'SEMINAR'
                    max_internal = 100
                    max_external = 0
                    max_total = 100
                    credits = 1

                # Calculate minimum passing marks
                # Non-Credit & Audit: 35% of 100, Regular: 35% for IA/External, 40% for total
                min_internal = int(max_internal * 0.35) if max_internal > 0 else 0
                min_external = int(max_external * 0.35) if max_external > 0 else 0
                min_total = int(max_total * (0.35 if subject_type in ['NON_CREDIT', 'AUDIT'] else 0.40))

                # Get or create subject
                subject, subject_created = Subject.objects.get_or_create(
                    code=subject_code,
                    defaults={
                        'name': subject_name,
                        'short_name': subject_name[:50],
                        'subject_type': subject_type,
                        'credits': credits,
                        'max_internal_marks': max_internal,
                        'max_external_marks': max_external,
                        'max_total_marks': max_total,
                        'min_internal_marks': min_internal,
                        'min_external_marks': min_external,
                        'min_total_marks': min_total,
                        'department': department,
                        'is_active': True
                    }
                )

                if subject_created:
                    logger.info(f"Created subject: {subject_code} ({subject_type})")

                # Map subject to semester
                SemesterSubject.objects.get_or_create(
                    subject=subject,
                    department=department,
                    semester=semester,
                    academic_year='2024-2025',
                    defaults={'is_active': True}
                )

                # Create or update result
                result_obj, result_created = StudentResult.objects.update_or_create(
                    student=student,
                    subject=subject,
                    semester=semester,
                    attempt_number=1,
                    defaults={
                        'internal_marks': subject_data['internal'],
                        'external_marks': subject_data['external'],
                        'total_marks': subject_data['total'],
                        'result_status': subject_data['result'],
                        'announced_date': subject_data.get('announced_date'),
                        'is_latest': True
                    }
                )

                if result_created:
                    records_created += 1
                    logger.info(f"Created result: {usn} - {subject_code}")
                else:
                    records_updated += 1
                    logger.info(f"Updated result: {usn} - {subject_code}")
            
            logger.info(f"Database save complete: {records_created} created, {records_updated} updated")
            return records_created, records_updated
            
        except Exception as e:
            logger.error(f"Database save failed: {e}")
            raise VTUScraperException(f"Database save failed: {e}")
    
    def scrape_result(self, usn: str, initiated_by: User) -> Dict:
        """
        Main scrape method for single USN
        
        Args:
            usn: University Seat Number
            initiated_by: User who initiated scrape
            
        Returns:
            Dictionary with scrape results
        """
        start_time = time.time()
        scrape_log = None
        
        try:
            logger.info(f"Starting scrape for USN: {usn}")
            
            # Navigate to VTU portal
            self.driver.get(self.VTU_RESULTS_URL)
            logger.info(f"Navigated to {self.VTU_RESULTS_URL}")
            time.sleep(2)
            
            # Solve CAPTCHA and login
            login_success = self._solve_captcha_and_login(usn)
            
            if not login_success:
                raise VTUScraperException("Failed to solve CAPTCHA and login")
            
            # Parse results
            result_data = self._parse_result_page()
            
            if not result_data:
                raise VTUScraperException("No results found on page")
            
            # Save to database
            records_created, records_updated = self._save_to_database(result_data, initiated_by)
            
            execution_time = time.time() - start_time
            
            # Create scrape log
            scrape_log = ScrapeLog.objects.create(
                initiated_by=initiated_by,
                usn=usn,
                status='SUCCESS',
                records_created=records_created,
                records_updated=records_updated,
                captcha_attempts=self.max_captcha_attempts,
                execution_time=Decimal(str(round(execution_time, 2)))
            )
            
            logger.info(f"Scrape completed successfully in {execution_time:.2f}s")
            
            return {
                'success': True,
                'usn': usn,
                'records_created': records_created,
                'records_updated': records_updated,
                'execution_time': execution_time,
                'log_id': str(scrape_log.id)
            }
            
        except VTUScraperException as e:
            error_msg = str(e)
            logger.error(f"Scraper error for {usn}: {error_msg}")
            
            execution_time = time.time() - start_time
            
            scrape_log = ScrapeLog.objects.create(
                initiated_by=initiated_by,
                usn=usn,
                status='FAILED',
                error_message=error_msg,
                captcha_attempts=self.max_captcha_attempts,
                execution_time=Decimal(str(round(execution_time, 2)))
            )
            
            return {
                'success': False,
                'usn': usn,
                'error': error_msg,
                'execution_time': execution_time,
                'log_id': str(scrape_log.id) if scrape_log else None
            }
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.exception(f"Unexpected error for {usn}")
            
            execution_time = time.time() - start_time
            
            scrape_log = ScrapeLog.objects.create(
                initiated_by=initiated_by,
                usn=usn,
                status='FAILED',
                error_message=error_msg,
                execution_time=Decimal(str(round(execution_time, 2)))
            )
            
            return {
                'success': False,
                'usn': usn,
                'error': error_msg,
                'execution_time': execution_time,
                'log_id': str(scrape_log.id) if scrape_log else None
            }
    
    def scrape_batch(self, usn_list: List[str], initiated_by: User) -> Dict:
        """
        Scrape results for multiple USNs
        
        Args:
            usn_list: List of USNs
            initiated_by: User who initiated scrape
            
        Returns:
            Batch scrape statistics
        """
        logger.info(f"Starting batch scrape for {len(usn_list)} USNs")
        
        results = []
        successful = 0
        failed = 0
        
        for usn in usn_list:
            result = self.scrape_result(usn, initiated_by)
            results.append(result)
            
            if result['success']:
                successful += 1
            else:
                failed += 1
            
            # Delay between requests
            time.sleep(2)
        
        logger.info(f"Batch scrape complete: {successful} successful, {failed} failed")
        
        return {
            'total': len(usn_list),
            'successful': successful,
            'failed': failed,
            'results': results
        }
    
    def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            logger.info("Closing browser...")
            try:
                self.driver.quit()
            except Exception as e:
                logger.error(f"Error closing browser: {e}")


# Convenience functions
def scrape_single_usn(usn: str, initiated_by: User, headless: bool = True) -> Dict:
    """
    Convenience function to scrape a single USN.

    Args:
        usn: University Seat Number
        initiated_by: User who initiated the scrape
        headless: Run browser in headless mode

    Returns:
        Dictionary with scrape results
    """
    with VTUResultScraper(headless=headless) as scraper:
        return scraper.scrape_result(usn, initiated_by)


def scrape_batch_usns(usn_list: List[str], initiated_by: User, headless: bool = True) -> Dict:
    """
    Convenience function to scrape multiple USNs.

    Args:
        usn_list: List of University Seat Numbers
        initiated_by: User who initiated the scrape
        headless: Run browser in headless mode

    Returns:
        Dictionary with batch scrape results
    """
    with VTUResultScraper(headless=headless) as scraper:
        return scraper.scrape_batch(usn_list, initiated_by)