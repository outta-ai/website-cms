import requests

server = "http://localhost:3001"
token = ""
project = ""

def main():
    memo = "OUTTA 3회 부트캠프 (2024) 데이터반"

    response = requests.get(f"{server}/api/members?where[memo][contains]={memo}&limit=100000", cookies={'payload-token': token})
    result = response.json()

    if 'docs' not in result:
        print(result)
        return
    
    members = result['docs']

    response = requests.get(f"{server}/api/projects/{project}?depth=0", cookies={'payload-token': token})
    result = response.json()

    if 'id' not in result:
        print(result)
        return
    
    data = [member['id'] for member in result['members']]
    for member in members:
        if member['id'] not in data:
            data.append(member['id'])

    response = requests.patch(f"{server}/api/projects/{project}", json={"members": [{"member": member_id} for member_id in data]}, cookies={'payload-token': token})
    


if __name__ == '__main__':
    main()