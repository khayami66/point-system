"""
メッセージ処理ロジックを担当するモジュール
"""
import logging
from config import Config, ACTION_MASTER, AVAILABLE_KEYWORDS
from sheets_service import SheetsService

logger = logging.getLogger(__name__)


class MessageHandler:
    """LINEメッセージを処理するクラス"""

    def __init__(self, sheets_service: SheetsService):
        """
        初期化

        Args:
            sheets_service: Google Sheets操作サービス
        """
        self.sheets = sheets_service
        self.child_id = Config.DEFAULT_CHILD_ID
        self.reward_threshold = Config.REWARD_THRESHOLD

    def handle_message(self, text: str) -> str:
        """
        メッセージを処理して返信文を生成

        Args:
            text: 受信したメッセージテキスト

        Returns:
            返信メッセージ
        """
        text = text.strip()

        # 今日のポイント確認
        if '今日' in text and 'ポイント' in text:
            return self._handle_today_points()

        # ごほうび状況確認
        if 'ごほうび' in text or 'ご褒美' in text:
            return self._handle_reward_status()

        # 行動記録
        action_result = self._detect_action(text)
        if action_result:
            return self._handle_action_record(action_result)

        # 未対応キーワード
        return self._handle_unknown()

    def _detect_action(self, text: str) -> tuple:
        """
        テキストから行動を検出

        Args:
            text: メッセージテキスト

        Returns:
            (行動名, ポイント) or None
        """
        for keyword, (action_name, points) in ACTION_MASTER.items():
            if keyword in text:
                return (action_name, points)
        return None

    def _handle_action_record(self, action_result: tuple) -> str:
        """
        行動記録を処理

        Args:
            action_result: (行動名, ポイント)

        Returns:
            返信メッセージ
        """
        action_name, points = action_result

        # 現在のステータスを取得
        status = self.sheets.get_status(self.child_id)
        if status is None:
            return "記録に失敗しました。しばらくしてからもう一度送ってください。"

        # 記録を追加
        if not self.sheets.add_record(self.child_id, action_name, points):
            return "記録に失敗しました。しばらくしてからもう一度送ってください。"

        # ポイントを更新
        new_total = status['total_points'] + points
        new_cycle = status['cycle_points'] + points

        # ごほうび達成チェック
        reward_message = ""
        if new_cycle >= self.reward_threshold:
            reward_message = f"\n\n🎉 おめでとう！{self.reward_threshold}ptたまりました！ごほうびを一緒に決めよう！"
            new_cycle -= self.reward_threshold

        # ステータスを更新
        if not self.sheets.update_status(self.child_id, new_total, new_cycle):
            return "記録に失敗しました。しばらくしてからもう一度送ってください。"

        # 今日の合計を取得
        today_summary = self.sheets.get_today_summary(self.child_id)
        today_points = today_summary['total_points']

        response = f"✅ {action_name}を記録しました！（+{points}pt）\n"
        response += f"今日は {today_points}pt、累計は {new_total}pt です。"
        response += reward_message

        return response

    def _handle_today_points(self) -> str:
        """
        今日のポイント確認を処理

        Returns:
            返信メッセージ
        """
        summary = self.sheets.get_today_summary(self.child_id)

        if summary['total_points'] == 0:
            return "今日はまだ記録がありません。\nがんばったことを送ってね！"

        response = f"📊 今日のポイントは {summary['total_points']}pt です。\n"

        for action, count in summary['actions'].items():
            response += f"・{action} {count}回\n"

        return response.rstrip()

    def _handle_reward_status(self) -> str:
        """
        ごほうび状況確認を処理

        Returns:
            返信メッセージ
        """
        status = self.sheets.get_status(self.child_id)
        if status is None:
            return "情報の取得に失敗しました。しばらくしてからもう一度送ってください。"

        cycle_points = status['cycle_points']
        total_points = status['total_points']
        remaining = self.reward_threshold - cycle_points

        response = f"🎁 ごほうび状況\n"
        response += f"現在の周回ポイント: {cycle_points}pt\n"
        response += f"累計ポイント: {total_points}pt\n\n"

        if remaining > 0:
            response += f"{self.reward_threshold}ptのごほうびまで、あと {remaining}pt！"
        else:
            response += f"🎉 ごほうび達成済み！次の {self.reward_threshold}pt を目指そう！"

        return response

    def _handle_unknown(self) -> str:
        """
        未対応キーワードの応答を生成

        Returns:
            返信メッセージ
        """
        keywords_str = "」「".join(AVAILABLE_KEYWORDS)
        return f"まだその言葉には対応していないよ。\n「{keywords_str}」などの言葉を含めて送ってね！\n\n「今日のポイント」で今日の記録を確認できるよ。"
