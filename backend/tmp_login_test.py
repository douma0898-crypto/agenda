from app import create_app

app = create_app('development')

with app.test_client() as client:
    response = client.post(
        '/api/auth/login',
        json={'email': 'douma@agenda.com', 'password': 'Douma02'},
        headers={'Content-Type': 'application/json'},
    )
    print('STATUS', response.status_code)
    print(response.get_data(as_text=True))
