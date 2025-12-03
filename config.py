"""
アプリケーション設定
環境変数から設定値を読み込む
"""
import os
import json
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む（ローカル開発用）
load_dotenv()


class Config:
    """アプリケーション設定クラス"""

    # LINE Bot設定
    LINE_CHANNEL_ACCESS_TOKEN = os.environ.get('LINE_CHANNEL_ACCESS_TOKEN')
    LINE_CHANNEL_SECRET = os.environ.get('LINE_CHANNEL_SECRET')

    # Google Sheets設定
    SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID')

    # Google サービスアカウント認証情報
    @staticmethod
    def get_google_credentials():
        """環境変数からGoogle認証情報を取得"""
        json_str = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
        if json_str:
            return json.loads(json_str)
        return None

    # ごほうび設定
    REWARD_THRESHOLD = 100  # ごほうび達成に必要なポイント

    # 子どもID（v1では固定）
    DEFAULT_CHILD_ID = 'child_01'

    # シート名
    SHEET_RECORDS = 'records'
    SHEET_STATUS = 'status'
    SHEET_ACTIONS = 'actions'


# 行動マスタ（v1ではコード内定数）
# キーワード: (行動名, ポイント)
ACTION_MASTER = {
    '宿題': ('宿題', 1),
    'スタスタ': ('スタスタ', 3),
    '早寝': ('早寝', 2),
    'お手伝い': ('お手伝い', 2),
}

# キーワードリスト（ヘルプメッセージ用）
AVAILABLE_KEYWORDS = list(ACTION_MASTER.keys())
