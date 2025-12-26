"""
ごほうびポイント管理Bot - メインアプリケーション
LINE Messaging API Webhook サーバー

v2: Supabase対応版
- DATA_SOURCE環境変数で切り替え可能
- 'supabase': Supabase使用（デフォルト）
- 'sheets': Google Sheets使用（v1互換）
"""
import logging
from flask import Flask, request, abort
from linebot.v3 import WebhookHandler
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    ReplyMessageRequest,
    TextMessage
)
from linebot.v3.webhooks import (
    MessageEvent,
    TextMessageContent
)
from linebot.v3.exceptions import InvalidSignatureError

from config import Config

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flaskアプリケーション
app = Flask(__name__)

# LINE Bot設定
configuration = Configuration(access_token=Config.LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(Config.LINE_CHANNEL_SECRET)

# サービス初期化
data_service = None
message_handler = None
use_supabase = Config.DATA_SOURCE == 'supabase'


def initialize_services():
    """サービスを初期化"""
    global data_service, message_handler, use_supabase

    try:
        if use_supabase:
            # Supabase版
            from supabase_service import SupabaseService
            from message_handler_v2 import MessageHandlerV2

            data_service = SupabaseService()
            message_handler = MessageHandlerV2(data_service)
            logger.info("Supabaseサービスの初期化が完了しました")
        else:
            # Google Sheets版（v1互換）
            from sheets_service import SheetsService
            from message_handler import MessageHandler

            data_service = SheetsService()
            message_handler = MessageHandler(data_service)
            logger.info("Google Sheetsサービスの初期化が完了しました")

    except Exception as e:
        logger.error(f"サービス初期化エラー: {e}")
        raise


@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return 'OK', 200


@app.route('/callback', methods=['POST'])
def callback():
    """LINE Webhook コールバック"""
    signature = request.headers.get('X-Line-Signature', '')
    body = request.get_data(as_text=True)

    logger.info(f"Webhook受信: {body[:100]}...")

    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        logger.error("署名検証エラー")
        abort(400)
    except Exception as e:
        logger.error(f"Webhook処理エラー: {e}")
        abort(500)

    return 'OK'


@handler.add(MessageEvent, message=TextMessageContent)
def handle_text_message(event):
    """テキストメッセージを処理"""
    global message_handler

    user_message = event.message.text
    user_id = event.source.user_id  # LINEユーザーID
    logger.info(f"メッセージ受信: {user_message} from {user_id}")

    # サービスが初期化されていない場合
    if message_handler is None:
        try:
            initialize_services()
        except Exception as e:
            logger.error(f"サービス初期化失敗: {e}")
            reply_text = "システムエラーが発生しました。しばらくしてからもう一度お試しください。"
            _send_reply(event.reply_token, reply_text)
            return

    # メッセージを処理
    try:
        if use_supabase:
            # Supabase版はLINEユーザーIDを渡す
            reply_text = message_handler.handle_message(user_message, user_id)
        else:
            # Google Sheets版（v1互換）
            reply_text = message_handler.handle_message(user_message)
    except Exception as e:
        logger.error(f"メッセージ処理エラー: {e}")
        import traceback
        logger.error(traceback.format_exc())
        reply_text = "エラーが発生しました。しばらくしてからもう一度お試しください。"

    _send_reply(event.reply_token, reply_text)


def _send_reply(reply_token: str, text: str):
    """返信メッセージを送信"""
    try:
        with ApiClient(configuration) as api_client:
            messaging_api = MessagingApi(api_client)
            messaging_api.reply_message(
                ReplyMessageRequest(
                    reply_token=reply_token,
                    messages=[TextMessage(text=text)]
                )
            )
        logger.info(f"返信送信: {text[:50]}...")
    except Exception as e:
        logger.error(f"返信送信エラー: {e}")


# アプリケーション起動時にサービスを初期化
try:
    initialize_services()
except Exception as e:
    logger.warning(f"起動時のサービス初期化スキップ: {e}")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
