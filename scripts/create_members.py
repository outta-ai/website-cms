import requests

def main():
    # server = input("Server Address: ")
    # token = input("payload-token Cookie: ")
    # memo = input("Memo: ")

    server = "https://api.outta.ai"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MGI0NTkwYWM5ZGRhYWYyYWZjMzdlZiIsImNvbGxlY3Rpb24iOiJhZG1pbnMiLCJlbWFpbCI6ImFkbWluQG91dHRhLmFpIiwiaWF0IjoxNzIwOTYwMzI0LCJleHAiOjE3MjA5Njc1MjR9.6W6bGTap2Yzp75fm_L0M-9cRCafi5uhBqfjSiGqcxY0"
    memo = "OUTTA 3회 부트캠프 (2024) 데이터반"

    if not server.startswith('http'):
        server = f'http://{server}'

    with open('data/members.csv', 'r') as f:  
        for line in f:
            line = line.strip()
            member = line.split(',')

            if member[1] == "#N/A":
                continue

            data = {
                "name": member[1],
                "email": member[0],
                "memo": memo,
            }

            response = requests.post(f'{server}/api/members', cookies={'payload-token': token}, json=data)
            result = response.json()

            if 'doc' not in result:
                print(result)
                break

            print(f"{result['doc']['id']} - {member[1]} {member[0]}")


if __name__ == '__main__':
    main()