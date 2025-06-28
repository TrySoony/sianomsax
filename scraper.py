import requests
from bs4 import BeautifulSoup

def get_gift_data(url: str) -> dict:
    """
    Получает данные о коллекционном подарке Telegram со страницы.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # Проверяем, что запрос успешный
    except requests.RequestException as e:
        print(f"Ошибка при загрузке страницы: {e}")
        return {}

    soup = BeautifulSoup(response.text, 'html.parser')
    
    data = {}

    # Извлекаем название
    title_tag = soup.find('div', class_='nft-title')
    if title_tag:
        data['title'] = title_tag.get_text(strip=True)

    # Извлекаем видео/гиф
    video_tag = soup.find('video', class_='nft-video')
    if video_tag and video_tag.has_attr('src'):
        data['media_url'] = video_tag['src']

    # Извлекаем данные из таблицы
    details_table = soup.find('div', class_='nft-details-table')
    if details_table:
        details = {}
        rows = details_table.find_all('div', class_='nft-details-row')
        for row in rows:
            key_tag = row.find('div', class_='nft-details-row-key')
            value_tag = row.find('div', class_='nft-details-row-value')
            if key_tag and value_tag:
                key = key_tag.get_text(strip=True).lower().replace(' ', '_')
                value_text = value_tag.get_text(separator='|', strip=True)
                # Разделяем текст и редкость
                parts = [p.strip() for p in value_text.split('|') if p.strip()]
                details[key] = {
                    'name': parts[0] if len(parts) > 0 else '',
                    'rarity': parts[1] if len(parts) > 1 else ''
                }
        data['details'] = details

    return data

if __name__ == '__main__':
    # Пример использования
    test_url = "https://t.me/nft/NailBracelet-168"
    gift_info = get_gift_data(test_url)
    
    import json
    print(json.dumps(gift_info, indent=2, ensure_ascii=False)) 