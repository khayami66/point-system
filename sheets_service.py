"""
Google Sheets API との連携を担当するモジュール
"""
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import logging

from config import Config

logger = logging.getLogger(__name__)

# Google Sheets APIのスコープ
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]


class SheetsService:
    """Google Sheets操作クラス"""

    def __init__(self):
        """初期化: Google Sheets APIクライアントを設定"""
        self.client = None
        self.spreadsheet = None
        self._connect()

    def _connect(self):
        """Google Sheets APIに接続"""
        try:
            credentials_info = Config.get_google_credentials()
            if not credentials_info:
                raise ValueError("Google認証情報が設定されていません")

            credentials = Credentials.from_service_account_info(
                credentials_info,
                scopes=SCOPES
            )
            self.client = gspread.authorize(credentials)
            self.spreadsheet = self.client.open_by_key(Config.SPREADSHEET_ID)
            logger.info("Google Sheetsに接続しました")
        except Exception as e:
            logger.error(f"Google Sheets接続エラー: {e}")
            raise

    def add_record(self, child_id: str, action: str, points: int, memo: str = '') -> bool:
        """
        行動記録を追加

        Args:
            child_id: 子どもID
            action: 行動名
            points: ポイント
            memo: メモ（オプション）

        Returns:
            成功時True、失敗時False
        """
        try:
            sheet = self.spreadsheet.worksheet(Config.SHEET_RECORDS)
            now = datetime.now()
            row = [
                now.strftime('%Y-%m-%d'),  # date
                now.strftime('%H:%M:%S'),  # time
                child_id,                   # child_id
                action,                     # action
                points,                     # points
                memo                        # memo
            ]
            sheet.append_row(row)
            logger.info(f"記録追加: {action} ({points}pt) for {child_id}")
            return True
        except Exception as e:
            logger.error(f"記録追加エラー: {e}")
            return False

    def get_status(self, child_id: str) -> dict:
        """
        ステータス（累計・周回ポイント）を取得

        Args:
            child_id: 子どもID

        Returns:
            {'total_points': int, 'cycle_points': int} or None
        """
        try:
            sheet = self.spreadsheet.worksheet(Config.SHEET_STATUS)

            # シートの全データを取得（ヘッダー含む）
            all_values = sheet.get_all_values()

            # ヘッダー行のみ、またはデータがない場合
            if len(all_values) <= 1:
                logger.info(f"ステータスが存在しないため新規作成: {child_id}")
                self._create_status(child_id)
                return {'total_points': 0, 'cycle_points': 0}

            # ヘッダー行を除いてデータを検索
            headers = all_values[0]
            for row in all_values[1:]:
                if len(row) >= 3 and row[0] == child_id:
                    return {
                        'total_points': int(row[1]) if row[1] else 0,
                        'cycle_points': int(row[2]) if row[2] else 0
                    }

            # 該当するchild_idがない場合は新規作成
            logger.info(f"child_id {child_id} が見つからないため新規作成")
            self._create_status(child_id)
            return {'total_points': 0, 'cycle_points': 0}
        except Exception as e:
            logger.error(f"ステータス取得エラー: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def _create_status(self, child_id: str):
        """新規ステータス行を作成"""
        try:
            sheet = self.spreadsheet.worksheet(Config.SHEET_STATUS)
            sheet.append_row([child_id, 0, 0])
            logger.info(f"新規ステータス作成: {child_id}")
        except Exception as e:
            logger.error(f"ステータス作成エラー: {e}")

    def update_status(self, child_id: str, total_points: int, cycle_points: int) -> bool:
        """
        ステータスを更新

        Args:
            child_id: 子どもID
            total_points: 累計ポイント
            cycle_points: 周回ポイント

        Returns:
            成功時True、失敗時False
        """
        try:
            sheet = self.spreadsheet.worksheet(Config.SHEET_STATUS)

            # シートの全データを取得（ヘッダー含む）
            all_values = sheet.get_all_values()

            # ヘッダー行のみ、またはデータがない場合は新規作成
            if len(all_values) <= 1:
                sheet.append_row([child_id, total_points, cycle_points])
                logger.info(f"ステータス新規作成: {child_id} - total={total_points}, cycle={cycle_points}")
                return True

            # 既存のchild_idを検索
            for i, row in enumerate(all_values[1:], start=2):  # 2行目から開始
                if len(row) >= 1 and row[0] == child_id:
                    sheet.update_cell(i, 2, total_points)  # total_points
                    sheet.update_cell(i, 3, cycle_points)  # cycle_points
                    logger.info(f"ステータス更新: {child_id} - total={total_points}, cycle={cycle_points}")
                    return True

            # 該当するchild_idがない場合は新規作成
            sheet.append_row([child_id, total_points, cycle_points])
            logger.info(f"ステータス新規追加: {child_id} - total={total_points}, cycle={cycle_points}")
            return True
        except Exception as e:
            logger.error(f"ステータス更新エラー: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    def get_today_records(self, child_id: str) -> list:
        """
        今日の記録を取得

        Args:
            child_id: 子どもID

        Returns:
            今日の記録リスト [{'action': str, 'points': int}, ...]
        """
        try:
            sheet = self.spreadsheet.worksheet(Config.SHEET_RECORDS)
            records = sheet.get_all_records()
            today = datetime.now().strftime('%Y-%m-%d')

            today_records = []
            for record in records:
                if record.get('date') == today and record.get('child_id') == child_id:
                    today_records.append({
                        'action': record.get('action'),
                        'points': int(record.get('points', 0))
                    })

            return today_records
        except Exception as e:
            logger.error(f"今日の記録取得エラー: {e}")
            return []

    def get_today_summary(self, child_id: str) -> dict:
        """
        今日の記録サマリーを取得

        Args:
            child_id: 子どもID

        Returns:
            {
                'total_points': int,
                'actions': {'行動名': 回数, ...}
            }
        """
        records = self.get_today_records(child_id)
        total_points = 0
        action_counts = {}

        for record in records:
            action = record['action']
            points = record['points']
            total_points += points
            action_counts[action] = action_counts.get(action, 0) + 1

        return {
            'total_points': total_points,
            'actions': action_counts
        }
