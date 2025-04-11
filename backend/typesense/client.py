import typesense

client = typesense.Client({
    'nodes': [{
        'host': 'localhost',       # 서버 주소
        'port': '8108',
        'protocol': 'http'
    }],
    'api_key': 'xyz',              # API 키
    'connection_timeout_seconds': 2
})