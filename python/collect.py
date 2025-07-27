#!/usr/bin/env python3
"""
Printer Data Collector for Firebase Integration
Collects print job data from network printers and stores in Firestore
"""

import os
import sys
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests
from requests.auth import HTTPBasicAuth
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import hashlib
import xml.etree.ElementTree as ET

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('printer_collector.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class PrinterCollector:
    def __init__(self):
        """Initialize the printer collector with Firebase connection"""
        self.db = None
        self.printers = []
        self.initialize_firebase()
        self.load_printer_config()
    
    def initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Initialize Firebase Admin SDK
            if not firebase_admin._apps:
                # Use service account key from environment variable
                service_account_info = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'))
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            logger.info("Firebase initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            sys.exit(1)
    
    def load_printer_config(self):
        """Load printer configuration from environment or config file"""
        try:
            # Load from environment variable or default config
            printer_config = os.getenv('PRINTER_CONFIG', '''[
                {
                    "ip": "192.168.3.41",
                    "name": "Canon Colour",
                    "model": "canon_color",
                    "username": "admin",
                    "password": "admin"
                },
                {
                    "ip": "192.168.3.42", 
                    "name": "Canon B/W",
                    "model": "canon_bw",
                    "username": "admin",
                    "password": "admin"
                },
                {
                    "ip": "192.168.3.43",
                    "name": "Brother",
                    "model": "brother",
                    "username": "admin",
                    "password": "admin"
                }
            ]''')
            
            self.printers = json.loads(printer_config)
            logger.info(f"Loaded {len(self.printers)} printer configurations")
        except Exception as e:
            logger.error(f"Failed to load printer config: {e}")
            self.printers = []
    
    def collect_canon_data(self, printer: Dict[str, str]) -> List[Dict[str, Any]]:
        """Collect data from Canon iR-ADV series printers"""
        jobs = []
        try:
            # Canon specific API endpoints
            base_url = f"http://{printer['ip']}"
            
            # Get job history (this is a simplified example)
            response = requests.get(
                f"{base_url}/rui/api/jobhistory",
                auth=HTTPBasicAuth(printer.get('username', 'admin'), 
                                 printer.get('password', 'admin')),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                # Parse Canon-specific job data format
                for job in data.get('jobs', []):
                    job_data = self.parse_canon_job(job, printer)
                    if job_data:
                        jobs.append(job_data)
            
        except Exception as e:
            logger.error(f"Failed to collect Canon data from {printer['ip']}: {e}")
        
        return jobs
    
    def collect_brother_data(self, printer: Dict[str, str]) -> List[Dict[str, Any]]:
        """Collect data from Brother printers"""
        jobs = []
        try:
            # Brother specific API endpoints
            base_url = f"http://{printer['ip']}"
            
            # Get job history
            response = requests.get(
                f"{base_url}/DevMgmt/JobDataDyn.xml",
                auth=HTTPBasicAuth(printer.get('username', 'admin'),
                                 printer.get('password', 'admin')),
                timeout=30
            )
            
            if response.status_code == 200:
                # Parse Brother XML response
                jobs = self.parse_brother_xml(response.text, printer)
            
        except Exception as e:
            logger.error(f"Failed to collect Brother data from {printer['ip']}: {e}")
        
        return jobs
    
    def parse_canon_job(self, job_data: Dict, printer: Dict) -> Optional[Dict[str, Any]]:
        """Parse Canon job data into standardized format"""
        try:
            return {
                'jobId': job_data.get('id', f"canon_{int(time.time())}"),
                'deviceIP': printer['ip'],
                'deviceName': printer['name'],
                'timestamp': datetime.fromisoformat(job_data.get('timestamp', datetime.now().isoformat())),
                'pagesA4BW': job_data.get('pages_a4_bw', 0),
                'pagesA4Color': job_data.get('pages_a4_color', 0),
                'pagesA3BW': job_data.get('pages_a3_bw', 0),
                'pagesA3Color': job_data.get('pages_a3_color', 0),
                'userCode': job_data.get('user_code', 'unknown'),
                'status': 'completed'
            }
        except Exception as e:
            logger.error(f"Failed to parse Canon job: {e}")
            return None
    
    def parse_brother_xml(self, xml_data: str, printer: Dict) -> List[Dict[str, Any]]:
        """Parse Brother XML job data"""
        jobs = []
        try:
            # Simplified XML parsing - in production, use proper XML parser
            # This is a placeholder for Brother-specific parsing logic
            root = ET.fromstring(xml_data)
            
            for job_elem in root.findall('.//Job'):
                job_data = {
                    'jobId': job_elem.get('id', f"brother_{int(time.time())}"),
                    'deviceIP': printer['ip'],
                    'deviceName': printer['name'],
                    'timestamp': datetime.now(),
                    'pagesA4BW': int(job_elem.findtext('PagesA4BW', '0')),
                    'pagesA4Color': int(job_elem.findtext('PagesA4Color', '0')),
                    'pagesA3BW': int(job_elem.findtext('PagesA3BW', '0')),
                    'pagesA3Color': int(job_elem.findtext('PagesA3Color', '0')),
                    'userCode': job_elem.findtext('UserCode', 'unknown'),
                    'status': 'completed'
                }
                jobs.append(job_data)
                
        except Exception as e:
            logger.error(f"Failed to parse Brother XML: {e}")
        
        return jobs
    
    def get_user_from_code(self, user_code: str) -> Optional[Dict[str, str]]:
        """Get user information from user code"""
        try:
            # Query Firestore for user with matching username/code
            users_ref = self.db.collection('users')
            query = users_ref.where('username', '==', user_code).limit(1)
            docs = query.stream()
            
            for doc in docs:
                user_data = doc.to_dict()
                return {
                    'uid': doc.id,
                    'displayName': user_data.get('displayName', f'User {user_code}'),
                    'department': user_data.get('department', 'Unknown')
                }
        except Exception as e:
            logger.error(f"Failed to get user from code {user_code}: {e}")
        
        return None
    
    def calculate_costs(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate costs for a print job based on current pricing"""
        try:
            # Get current pricing from Firestore
            pricing_doc = self.db.collection('settings').document('pricing').get()
            if pricing_doc.exists:
                prices = pricing_doc.to_dict()
            else:
                # Default pricing
                prices = {
                    'a4BW': 0.05,
                    'a4Color': 0.15,
                    'a3BW': 0.10,
                    'a3Color': 0.30,
                }
            
            # Calculate individual costs
            cost_a4_bw = job_data['pagesA4BW'] * prices['a4BW']
            cost_a4_color = job_data['pagesA4Color'] * prices['a4Color']
            cost_a3_bw = job_data['pagesA3BW'] * prices['a3BW']
            cost_a3_color = job_data['pagesA3Color'] * prices['a3Color']
            
            total_cost = cost_a4_bw + cost_a4_color + cost_a3_bw + cost_a3_color
            
            job_data.update({
                'costA4BW': round(cost_a4_bw, 3),
                'costA4Color': round(cost_a4_color, 3),
                'costA3BW': round(cost_a3_bw, 3),
                'costA3Color': round(cost_a3_color, 3),
                'totalCost': round(total_cost, 2)
            })
            
        except Exception as e:
            logger.error(f"Failed to calculate costs: {e}")
            # Set default costs to 0
            job_data.update({
                'costA4BW': 0, 'costA4Color': 0, 'costA3BW': 0,
                'costA3Color': 0, 'totalCost': 0
            })
        
        return job_data
    
    def store_job_data(self, jobs: List[Dict[str, Any]]):
        """Store collected job data in Firestore"""
        try:
            batch = self.db.batch()
            stored_count = 0
            
            for job in jobs:
                # Get user information
                user_info = self.get_user_from_code(job['userCode'])
                if user_info:
                    job.update({
                        'uid': user_info['uid'],
                        'userDisplayName': user_info['displayName'],
                        'department': user_info['department']
                    })
                else:
                    # Skip jobs without valid user codes
                    logger.warning(f"Skipping job with unknown user code: {job['userCode']}")
                    continue
                
                # Calculate costs
                job = self.calculate_costs(job)
                
                # Check if job already exists
                existing_job = self.db.collection('printJobs').document(job['jobId']).get()
                if not existing_job.exists:
                    # Add to batch
                    job_ref = self.db.collection('printJobs').document(job['jobId'])
                    batch.set(job_ref, job)
                    stored_count += 1
            
            # Commit batch
            if stored_count > 0:
                batch.commit()
                logger.info(f"Stored {stored_count} new print jobs")
            else:
                logger.info("No new jobs to store")
                
        except Exception as e:
            logger.error(f"Failed to store job data: {e}")
    
    def collect_all_printers(self):
        """Collect data from all configured printers"""
        logger.info("Starting printer data collection")
        all_jobs = []
        
        for printer in self.printers:
            logger.info(f"Collecting data from {printer['name']} ({printer['ip']})")
            
            try:
                if printer['model'] in ['canon_color', 'canon_bw']:
                    jobs = self.collect_canon_data(printer)
                elif printer['model'] == 'brother':
                    jobs = self.collect_brother_data(printer)
                else:
                    logger.warning(f"Unknown printer model: {printer['model']}")
                    continue
                
                all_jobs.extend(jobs)
                logger.info(f"Collected {len(jobs)} jobs from {printer['name']}")
                
            except Exception as e:
                logger.error(f"Failed to collect from {printer['name']}: {e}")
        
        # Store all collected jobs
        if all_jobs:
            self.store_job_data(all_jobs)
        
        logger.info(f"Collection completed. Total jobs processed: {len(all_jobs)}")
    
    def run_health_check(self):
        """Run health check on all printers"""
        logger.info("Running printer health check")
        
        for printer in self.printers:
            try:
                response = requests.get(
                    f"http://{printer['ip']}/",
                    timeout=10
                )
                if response.status_code == 200:
                    logger.info(f"✓ {printer['name']} is online")
                else:
                    logger.warning(f"⚠ {printer['name']} returned status {response.status_code}")
            except Exception as e:
                logger.error(f"✗ {printer['name']} is offline: {e}")

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
    collector = PrinterCollector()
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == 'health':
            collector.run_health_check()
            return
        elif sys.argv[1] == 'test':
            logger.info("Running in test mode")
            collector.collect_all_printers()
            return
    
    # Normal collection mode
    collector.collect_all_printers()

if __name__ == "__main__":
    main()
