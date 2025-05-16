import typesense

# Typesense 클라이언트 설정
client = typesense.Client({
    'nodes': [{
        'host': 'localhost',  # Typesense 서버 주소
        'port': '8108',       # 기본 포트
        'protocol': 'http'    # 프로토콜
    }],
    'api_key': 'xyz',  # API 키
    'connection_timeout_seconds': 2
})

# 재료를 기반으로 레시피 검색 예시
def search_by_ingredient(ingredient):
    search_parameters = {
        'q': ingredient,            # 검색할 재료 이름
        'query_by': 'ingredients',  # ingredients 필드를 기준으로 검색
        'per_page': 20               # 한 번에 가져올 최대 레시피 개수
    }
    
    # 검색 실행
    search_results = client.collections['recipes'].documents.search(search_parameters)

    # 검색된 레시피 ID와 제목만 출력
    for hit in search_results['hits']:
        recipe_id = hit['document']['id'] 
        title = hit['document']['title']  
        ingredient = hit['document']['ingredients']
        difficulty = hit['document']['difficulty']
        print(f"레시피 ID: {recipe_id}, 제목: {title}, 난이도 : {difficulty}\n")

# 예시: "또띠아" 재료로 검색
search_by_ingredient("감자, 토마토")
