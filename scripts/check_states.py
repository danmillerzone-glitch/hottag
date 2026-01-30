import json

with open('events.json', 'r') as f:
    events = json.load(f)

# Show events with missing states
missing = [e for e in events if not e.get('state')]
print(f'Events missing state: {len(missing)} of {len(events)}')
print()
for e in missing[:20]:
    print(f"{e['city']} - {e['name']}")
