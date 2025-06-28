# Конфигурационный файл для бота
import os
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

TOKEN = os.getenv("BOT_TOKEN", "7610198463:AAFzPUFqEeYqYbRA-yItm61HkOq_MRKLxHI")
ADMIN_ID = int(os.getenv("ADMIN_ID", "5058443853"))  # Ваш Telegram ID 