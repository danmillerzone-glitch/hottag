"""
Check ticket URL status in database
"""
import requests
from config import SUPABASE_URL, HEADERS

# Check how many events have ticket URLs
url = f'{SUPABASE_URL}/rest/v1/events?select=id,name,ticket_url&limit=500'
response = requests.get(url, headers=HEADERS)
events = response.json()

with_tickets = [e for e in events if e.get('ticket_url')]
without_tickets = [e for e in events if not e.get('ticket_url')]

print(f'Total events: {len(events)}')
print(f'With ticket URLs: {len(with_tickets)}')
print(f'Without ticket URLs: {len(without_tickets)}')

if with_tickets:
    print('\nSample events with tickets:')
    for e in with_tickets[:5]:
        print(f'  {e["name"]}: {e["ticket_url"]}')
