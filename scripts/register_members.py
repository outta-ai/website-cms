import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MGI0NTkwYWM5ZGRhYWYyYWZjMzdlZiIsImNvbGxlY3Rpb24iOiJhZG1pbnMiLCJlbWFpbCI6ImFkbWluQG91dHRhLmFpIiwiaWF0IjoxNzIwOTYwMzI0LCJleHAiOjE3MjA5Njc1MjR9.6W6bGTap2Yzp75fm_L0M-9cRCafi5uhBqfjSiGqcxY0"
project = "6693836b797bdce9d70ff373"

def main():
    memo = "OUTTA 3회 부트캠프 (2024) 데이터반"

    response = requests.get(f"https://api.outta.ai/api/members?where[memo][contains]={memo}&limit=100000", cookies={'payload-token': token})
    result = response.json()

    if 'docs' not in result:
        print(result)
        return
    
    members = result['docs']

    response = requests.get(f"https://api.outta.ai/api/projects/{project}?depth=0", cookies={'payload-token': token})
    result = response.json()

    if 'id' not in result:
        print(result)
        return
    
    data = [member['id'] for member in result['members']]
    for member in members:
        if member['id'] not in data:
            data.append(member['id'])

    response = requests.patch(f"https://api.outta.ai/api/projects/{project}", json={"members": [{"member": member_id} for member_id in data]}, cookies={'payload-token': token})
    


if __name__ == '__main__':
    main()