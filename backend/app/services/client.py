import os
import typesense
from dotenv import load_dotenv

load_dotenv()

client = typesense.Client({
    'nodes': [{
        'host': os.getenv("TYPESENSE_HOST", "localhost"),
        'port': int(os.getenv("TYPESENSE_PORT", 8108)),  # 기본값 8108
        'protocol': 'http'
    }],
    'api_key': os.getenv("TYPESENSE_API_KEY", "xyz"),
    'connection_timeout_seconds': 2
})
