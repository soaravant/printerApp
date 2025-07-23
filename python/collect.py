import os
import json
import logging
import requests
from datetime import datetime, timezone
from typing import Dict, List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from bs4 import BeautifulSoup
import hashlib
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PrinterCollector:
    def __init__(self):
        """Initialize Firebase Admin SDK and printer configuration"""
        self.setup_firebase()
        self.setup_printer_config()
        
    def setup_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Initialize Firebase Admin SDK
            if not firebase_admin._apps:
                # Use service account key from environment variable
                service_account_info = json.loads(os.environ.get('SERVICE_ACCOUNT_JSON', '{}'))
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            logger.info("Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise
    
    def setup_printer_config(self):
        """Setup printer configuration from environment variables"""
        self.printer_ips = os.environ.get('PRINTER_IPS', '192.168.3.41,192.168.3.42').split(',')
        self.printer_ips = [ip.strip() for ip in self.printer_ips]
        
        # Pricing configuration
        self.bw_rate = float(os.environ.get('BW_RATE', '0.05'))
        self.color_rate = float(os.environ.get('COLOR_RATE', '0.15'))
        self.scan_rate = float(os.environ.get('SCAN_RATE', '0.02'))
        
        logger.info(f"Configured for printers: {self.printer_ips}")
        logger.info(f"Rates - B&W: ${self.bw_rate}, Color: ${self.color_rate}, Scan: ${self.scan_rate}")
    
    def fetch_printer_status(self, printer_ip: str) -> Optional[Dict]:
        """Fetch printer status from network printer web interface"""
        try:
            # Common printer status page URLs
            status_urls = [
                f"http://{printer_ip}/",
                f"http://{printer_ip}/status.html",
                f"http://{printer_ip}/printer/status",
                f"http://{printer_ip}/web/guest/en/websys/webArch/mainFrame.cgi",
            ]
            
            for url in status_urls:
                try:
                    response = requests.get(url, timeout=10)
                    if response.status_code == 200:
                        return self.parse_printer_data(response.text, printer_ip)
                except requests.RequestException:
                    continue
            
            logger.warning(f"Could not fetch status from printer {printer_ip}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching printer status from {printer_ip}: {e}")
            return None
    
    def parse_printer_data(self, html_content: str, printer_ip: str) -> Dict:
        """Parse printer data from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # This is a generic parser - you'll need to customize based on your printer models
        # Common patterns for different printer brands:
        
        data = {
            'deviceIP': printer_ip,
            'pagesBW': 0,
            'pagesColor': 0,
            'scans': 0,
            'timestamp': datetime.now(timezone.utc),
            'raw_data': html_content[:500]  # Store sample for debugging
        }
        
        # Try to extract counter information
        # Look for common patterns in printer web interfaces
        text_content = soup.get_text().lower()
        
        # Pattern matching for different printer types
        if 'total pages' in text_content or 'page count' in text_content:
            data.update(self.extract_generic_counters(soup))
        elif 'canon' in text_content:
            data.update(self.extract_canon_counters(soup))
        elif 'hp' in text_content or 'hewlett' in text_content:
            data.update(self.extract_hp_counters(soup))
        elif 'brother' in text_content:
            data.update(self.extract_brother_counters(soup))
        else:
            # Fallback: look for numbers that might be counters
            data.update(self.extract_fallback_counters(soup))
        
        return data
    
    def extract_generic_counters(self, soup: BeautifulSoup) -> Dict:
        """Extract counters using generic patterns"""
        counters = {'pagesBW': 0, 'pagesColor': 0, 'scans': 0}
        
        # Look for table rows or divs containing counter information
        for element in soup.find_all(['tr', 'div', 'span']):
            text = element.get_text().strip().lower()
            
            if 'black' in text or 'mono' in text or 'b&w' in text:
                numbers = [int(s) for s in text.split() if s.isdigit()]
                if numbers:
                    counters['pagesBW'] = max(numbers)
            
            elif 'color' in text or 'colour' in text:
                numbers = [int(s) for s in text.split() if s.isdigit()]
                if numbers:
                    counters['pagesColor'] = max(numbers)
            
            elif 'scan' in text or 'copy' in text:
                numbers = [int(s) for s in text.split() if s.isdigit()]
                if numbers:
                    counters['scans'] = max(numbers)
        
        return counters
    
    def extract_canon_counters(self, soup: BeautifulSoup) -> Dict:
        """Extract counters for Canon printers"""
        # Canon-specific parsing logic
        return self.extract_generic_counters(soup)
    
    def extract_hp_counters(self, soup: BeautifulSoup) -> Dict:
        """Extract counters for HP printers"""
        # HP-specific parsing logic
        return self.extract_generic_counters(soup)
    
    def extract_brother_counters(self, soup: BeautifulSoup) -> Dict:
        """Extract counters for Brother printers"""
        # Brother-specific parsing logic
        return self.extract_generic_counters(soup)
    
    def extract_fallback_counters(self, soup: BeautifulSoup) -> Dict:
        """Fallback counter extraction"""
        # Simple fallback - look for any large numbers that might be page counts
        counters = {'pagesBW': 0, 'pagesColor': 0, 'scans': 0}
        
        text = soup.get_text()
        numbers = [int(s) for s in text.split() if s.isdigit() and len(s) >= 3]
        
        if len(numbers) >= 2:
            # Assume first large number is B&W, second is color
            counters['pagesBW'] = numbers[0]
            if len(numbers) > 1:
                counters['pagesColor'] = numbers[1]
            if len(numbers) > 2:
                counters['scans'] = numbers[2]
        
        return counters
    
    def generate_job_id(self, printer_data: Dict) -> str:
        """Generate unique job ID based on printer data"""
        # Create hash based on printer IP, timestamp (rounded to hour), and counter values
        timestamp_hour = printer_data['timestamp'].replace(minute=0, second=0, microsecond=0)
        hash_input = f"{printer_data['deviceIP']}-{timestamp_hour}-{printer_data['pagesBW']}-{printer_data['pagesColor']}-{printer_data['scans']}"
        return hashlib.md5(hash_input.encode()).hexdigest()
    
    def store_printer_data(self, printer_data: Dict):
        """Store printer data in Firestore"""
        try:
            job_id = self.generate_job_id(printer_data)
            
            # Check if this job already exists (deduplication)
            existing_job = self.db.collection('jobs').document(job_id).get()
            if existing_job.exists:
                logger.info(f"Job {job_id} already exists, skipping")
                return
            
            # For now, we'll create jobs without a specific user (uid)
            # In a real implementation, you'd need to associate jobs with users
            # This could be done through printer authentication logs or user assignment
            job_data = {
                'jobId': job_id,
                'uid': 'system',  # Placeholder - you'll need user association logic
                'pagesBW': printer_data['pagesBW'],
                'pagesColor': printer_data['pagesColor'],
                'scans': printer_data['scans'],
                'deviceIP': printer_data['deviceIP'],
                'timestamp': printer_data['timestamp'],
                'cost': self.calculate_cost(printer_data)
            }
            
            self.db.collection('jobs').document(job_id).set(job_data)
            logger.info(f"Stored job {job_id} for printer {printer_data['deviceIP']}")
            
        except Exception as e:
            logger.error(f"Error storing printer data: {e}")
    
    def calculate_cost(self, printer_data: Dict) -> float:
        """Calculate cost for print job"""
        return (
            printer_data['pagesBW'] * self.bw_rate +
            printer_data['pagesColor'] * self.color_rate +
            printer_data['scans'] * self.scan_rate
        )
    
    def collect_from_all_printers(self):
        """Collect data from all configured printers"""
        logger.info("Starting printer data collection")
        
        for printer_ip in self.printer_ips:
            logger.info(f"Collecting data from printer {printer_ip}")
            
            printer_data = self.fetch_printer_status(printer_ip)
            if printer_data:
                self.store_printer_data(printer_data)
            else:
                logger.warning(f"No data collected from printer {printer_ip}")
        
        logger.info("Printer data collection completed")
    
    def generate_monthly_billing(self):
        """Generate monthly billing records"""
        try:
            current_month = datetime.now().strftime('%Y-%m')
            
            # Get all jobs for current month
            jobs_ref = self.db.collection('jobs')
            start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            jobs = jobs_ref.where('timestamp', '>=', start_of_month).stream()
            
            # Group by user
            user_totals = {}
            for job in jobs:
                job_data = job.to_dict()
                uid = job_data.get('uid', 'system')
                
                if uid not in user_totals:
                    user_totals[uid] = 0
                
                user_totals[uid] += job_data.get('cost', 0)
            
            # Create billing records
            for uid, total_cost in user_totals.items():
                if uid == 'system':
                    continue  # Skip system jobs
                
                billing_id = f"{uid}-{current_month}"
                billing_data = {
                    'billingId': billing_id,
                    'uid': uid,
                    'period': current_month,
                    'totalCost': total_cost,
                    'paid': False,
                    'generated': datetime.now(timezone.utc)
                }
                
                # Use merge to avoid overwriting existing records
                self.db.collection('billing').document(billing_id).set(billing_data, merge=True)
                logger.info(f"Generated billing record for user {uid}: ${total_cost:.2f}")
        
        except Exception as e:
            logger.error(f"Error generating monthly billing: {e}")

def main():
    """Main execution function"""
    try:
        collector = PrinterCollector()
        
        # Collect printer data
        collector.collect_from_all_printers()
        
        # Generate monthly billing (run this less frequently)
        if datetime.now().hour == 0:  # Run once per day at midnight
            collector.generate_monthly_billing()
        
        logger.info("Collection cycle completed successfully")
        
    except Exception as e:
        logger.error(f"Collection failed: {e}")
        raise

if __name__ == "__main__":
    main()
