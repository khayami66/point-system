"""
メッセージ処理ロジック（v2: Supabase版）
LINEユーザーと家庭の紐付け、Supabaseからの行動マスタ取得に対応
"""
import logging
from config import Config
from supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class MessageHandlerV2:
    """LINEメッセージを処理するクラス（Supabase版）"""

    def __init__(self, supabase_service: SupabaseService):
        """
        初期化

        Args:
            supabase_service: Supabase操作サービス
        """
        self.supabase = supabase_service
        self.reward_threshold = Config.REWARD_THRESHOLD

    def handle_message(self, text: str, line_user_id: str) -> str:
        """
        メッセージを処理して返信文を生成

        Args:
            text: 受信したメッセージテキスト
            line_user_id: LINEユーザーID

        Returns:
            返信メッセージ
        """
        text = text.strip()

        # 紐付けコマンド（例: 「登録 abc123xyz789」）
        if text.startswith('登録 ') or text.startswith('登録　'):
            share_code = text.split(maxsplit=1)[1].strip() if len(text.split(maxsplit=1)) > 1 else ''
            return self._handle_link_family(line_user_id, share_code)

        # 家庭情報を取得
        family = self.supabase.get_family_by_line_user(line_user_id)
        if not family:
            return self._handle_not_linked()

        # 子どもリストを取得（最初の子どもを使用）
        children = self.supabase.get_children(family['id'])
        if not children:
            return "お子さんが登録されていません。\nWebアプリで子どもを登録してください。"

        child = children[0]  # v2では最初の子どもを使用
        child_id = child['id']

        # 今日のポイント確認
        if '今日' in text and 'ポイント' in text:
            return self._handle_today_points(child_id, child)

        # ごほうび状況確認
        if 'ごほうび' in text or 'ご褒美' in text:
            return self._handle_reward_status(child, family['id'])

        # 行動記録
        action_result = self._detect_action(text, family['id'])
        if action_result:
            return self._handle_action_record(action_result, child_id, child)

        # 未対応キーワード
        return self._handle_unknown(family['id'])

    def _handle_link_family(self, line_user_id: str, share_code: str) -> str:
        """
        家庭との紐付けを処理

        Args:
            line_user_id: LINEユーザーID
            share_code: 共有コード

        Returns:
            返信メッセージ
        """
        if not share_code:
            return "共有コードを入力してください。\n例: 「登録 abc123xyz789」\n\n共有コードはWebアプリの「共有URL」画面で確認できます。"

        # 既に紐付けられているか確認
        existing = self.supabase.get_family_by_line_user(line_user_id)
        if existing:
            return "すでに家庭と紐付けられています。\n別の家庭に変更する場合は、管理者にお問い合わせください。"

        # 紐付け実行
        if self.supabase.link_line_user_to_family(line_user_id, share_code):
            return "✅ 紐付けが完了しました！\n\nこれで行動を記録できます。\n「宿題やった」などと送ってみてください。"
        else:
            return "共有コードが見つかりませんでした。\n正しいコードを入力してください。\n\n共有コードはWebアプリの「共有URL」画面で確認できます。"

    def _handle_not_linked(self) -> str:
        """
        紐付けされていない場合の応答

        Returns:
            返信メッセージ
        """
        return "まだ家庭と紐付けられていません。\n\n紐付けるには、Webアプリの「共有URL」画面に表示されている共有コードを使って、\n「登録 共有コード」\nと送ってください。\n\n例: 「登録 abc123xyz789」"

    def _detect_action(self, text: str, family_id: str) -> tuple:
        """
        テキストから行動を検出

        Args:
            text: メッセージテキスト
            family_id: 家庭ID

        Returns:
            (行動情報dict, ポイント) or None
        """
        actions = self.supabase.get_actions(family_id)

        for action in actions:
            # 行動名がテキストに含まれているか確認
            if action['name'] in text:
                return (action, action['points'])

        return None

    def _handle_action_record(self, action_result: tuple, child_id: str, child: dict) -> str:
        """
        行動記録を処理

        Args:
            action_result: (行動情報, ポイント)
            child_id: 子どもID
            child: 子ども情報

        Returns:
            返信メッセージ
        """
        action, points = action_result
        action_name = action['name']
        action_id = action['id']

        # 記録を追加
        if not self.supabase.add_record(child_id, action_id, points):
            return "記録に失敗しました。しばらくしてからもう一度送ってください。"

        # ポイントを更新
        result = self.supabase.update_child_points(child_id, points, self.reward_threshold)
        if not result:
            return "記録に失敗しました。しばらくしてからもう一度送ってください。"

        # ごほうび達成チェック
        reward_message = ""
        if result['reward_achieved']:
            reward_message = f"\n\n🎉 おめでとう！{self.reward_threshold}ptたまりました！ごほうびを一緒に決めよう！"

        # 今日の合計を取得
        today_summary = self.supabase.get_today_summary(child_id)
        today_points = today_summary['total_points']

        child_name = child.get('nickname') or child.get('name', '')
        name_prefix = f"【{child_name}】" if child_name else ""

        response = f"{name_prefix}✅ {action_name}を記録しました！（+{points}pt）\n"
        response += f"今日は {today_points}pt、累計は {result['total_points']}pt です。"
        response += reward_message

        return response

    def _handle_today_points(self, child_id: str, child: dict) -> str:
        """
        今日のポイント確認を処理

        Args:
            child_id: 子どもID
            child: 子ども情報

        Returns:
            返信メッセージ
        """
        summary = self.supabase.get_today_summary(child_id)

        child_name = child.get('nickname') or child.get('name', '')
        name_prefix = f"【{child_name}】" if child_name else ""

        if summary['total_points'] == 0:
            return f"{name_prefix}今日はまだ記録がありません。\nがんばったことを送ってね！"

        response = f"{name_prefix}📊 今日のポイントは {summary['total_points']}pt です。\n"

        for action, count in summary['actions'].items():
            response += f"・{action} {count}回\n"

        return response.rstrip()

    def _handle_reward_status(self, child: dict, family_id: str) -> str:
        """
        ごほうび状況確認を処理

        Args:
            child: 子ども情報
            family_id: 家庭ID

        Returns:
            返信メッセージ
        """
        cycle_points = child['cycle_points']
        total_points = child['total_points']
        remaining = self.reward_threshold - cycle_points

        child_name = child.get('nickname') or child.get('name', '')
        name_prefix = f"【{child_name}】" if child_name else ""

        response = f"{name_prefix}🎁 ごほうび状況\n"
        response += f"現在のポイント: {cycle_points}pt\n"
        response += f"累計ポイント: {total_points}pt\n\n"

        if remaining > 0:
            response += f"{self.reward_threshold}ptのごほうびまで、あと {remaining}pt！"
        else:
            response += f"🎉 ごほうび達成済み！次の {self.reward_threshold}pt を目指そう！"

        # 目標を表示
        goals = self.supabase.get_goals(family_id)
        if goals:
            response += "\n\n📌 目標:\n"
            for goal in goals[:3]:  # 最大3件表示
                target = f"（{goal['target_points']}pt）" if goal.get('target_points') else ""
                response += f"・{goal['title']}{target}\n"

        return response.rstrip()

    def _handle_unknown(self, family_id: str) -> str:
        """
        未対応キーワードの応答を生成

        Args:
            family_id: 家庭ID

        Returns:
            返信メッセージ
        """
        actions = self.supabase.get_actions(family_id)

        if not actions:
            return "行動が登録されていません。\nWebアプリで行動を登録してください。"

        keywords = [action['name'] for action in actions]
        keywords_str = "」「".join(keywords)

        return f"まだその言葉には対応していないよ。\n「{keywords_str}」などの言葉を含めて送ってね！\n\n「今日のポイント」で今日の記録を確認できるよ。"
