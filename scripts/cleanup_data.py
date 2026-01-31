"""
HotTag - Clean up test data and reset promotion regions

Usage:
    python cleanup_data.py
"""

import requests
from config import SUPABASE_URL, HEADERS

def delete_test_events():
    """Delete events with 'test' in the name"""
    # First find test events
    url = f'{SUPABASE_URL}/rest/v1/events?select=id,name&name=ilike.*test*'
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Error fetching events: {response.text}")
        return
    
    events = response.json()
    print(f"Found {len(events)} test events:")
    for e in events:
        print(f"  - {e['name']}")
    
    if not events:
        print("No test events to delete")
        return
    
    confirm = input("\nDelete these events? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Cancelled")
        return
    
    # Delete each event
    deleted = 0
    for event in events:
        url = f"{SUPABASE_URL}/rest/v1/events?id=eq.{event['id']}"
        response = requests.delete(url, headers=HEADERS)
        if response.status_code == 204:
            print(f"  Deleted: {event['name']}")
            deleted += 1
        else:
            print(f"  Failed to delete: {event['name']}")
    
    print(f"\nDeleted {deleted} test events")


def reset_all_promotion_regions():
    """Clear all promotion regions so they can be reassigned"""
    url = f'{SUPABASE_URL}/rest/v1/promotions?select=id,name,region'
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Error fetching promotions: {response.text}")
        return
    
    promotions = response.json()
    print(f"Found {len(promotions)} promotions")
    
    confirm = input("Reset all promotion regions to NULL? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Cancelled")
        return
    
    # Update all promotions
    url = f"{SUPABASE_URL}/rest/v1/promotions?region=not.is.null"
    response = requests.patch(url, headers=HEADERS, json={'region': None})
    
    if response.status_code == 204:
        print("All promotion regions reset to NULL")
        print("Now run: python fix_promotion_regions.py")
    else:
        print(f"Error: {response.text}")


def main():
    print("HotTag Data Cleanup")
    print("=" * 40)
    print("1. Delete test events")
    print("2. Reset all promotion regions")
    print("3. Both")
    print("4. Cancel")
    
    choice = input("\nChoice: ")
    
    if choice == '1':
        delete_test_events()
    elif choice == '2':
        reset_all_promotion_regions()
    elif choice == '3':
        delete_test_events()
        print()
        reset_all_promotion_regions()
    else:
        print("Cancelled")


if __name__ == '__main__':
    main()
