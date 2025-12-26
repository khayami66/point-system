"""
Supabase との連携を担当するモジュール
Google Sheets の代替として使用
"""
import os
import logging
from datetime import datetime
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SupabaseService:
    """Supabase操作クラス"""

    def __init__(self):
        """初期化: Supabaseクライアントを設定"""
        self.client: Client = None
        self._connect()

    def _connect(self):
        """Supabaseに接続"""
        try:
            url = os.environ.get('SUPABASE_URL')
            key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

            if not url or not key:
                raise ValueError("Supabase認証情報が設定されていません")

            self.client = create_client(url, key)
            logger.info("Supabaseに接続しました")
        except Exception as e:
            logger.error(f"Supabase接続エラー: {e}")
            raise

    def get_family_by_line_user(self, line_user_id: str) -> dict:
        """
        LINEユーザーIDから家庭情報を取得

        Args:
            line_user_id: LINEユーザーID

        Returns:
            家庭情報 or None
        """
        try:
            # line_user_familiesテーブルから検索
            result = self.client.table('line_user_families').select(
                'family_id, families(*)'
            ).eq('line_user_id', line_user_id).execute()

            if result.data and len(result.data) > 0:
                return result.data[0].get('families')
            return None
        except Exception as e:
            logger.error(f"家庭取得エラー: {e}")
            return None

    def link_line_user_to_family(self, line_user_id: str, family_share_code: str) -> bool:
        """
        LINEユーザーを家庭に紐付け

        Args:
            line_user_id: LINEユーザーID
            family_share_code: 家庭の共有コード

        Returns:
            成功時True
        """
        try:
            # 共有コードから家庭を検索
            family_result = self.client.table('families').select('id').eq(
                'share_code', family_share_code
            ).execute()

            if not family_result.data or len(family_result.data) == 0:
                logger.warning(f"共有コードが見つかりません: {family_share_code}")
                return False

            family_id = family_result.data[0]['id']

            # 紐付けを作成
            self.client.table('line_user_families').upsert({
                'line_user_id': line_user_id,
                'family_id': family_id
            }).execute()

            logger.info(f"LINEユーザー紐付け完了: {line_user_id} -> {family_id}")
            return True
        except Exception as e:
            logger.error(f"LINEユーザー紐付けエラー: {e}")
            return False

    def get_actions(self, family_id: str) -> list:
        """
        家庭の有効な行動マスタを取得

        Args:
            family_id: 家庭ID

        Returns:
            行動リスト [{'name': str, 'points': int}, ...]
        """
        try:
            result = self.client.table('actions').select('*').eq(
                'family_id', family_id
            ).eq('is_active', True).order('display_order').execute()

            return result.data or []
        except Exception as e:
            logger.error(f"行動マスタ取得エラー: {e}")
            return []

    def get_children(self, family_id: str) -> list:
        """
        家庭の子どもリストを取得

        Args:
            family_id: 家庭ID

        Returns:
            子どもリスト
        """
        try:
            result = self.client.table('children').select('*').eq(
                'family_id', family_id
            ).order('created_at').execute()

            return result.data or []
        except Exception as e:
            logger.error(f"子ども取得エラー: {e}")
            return []

    def get_child(self, child_id: str) -> dict:
        """
        子ども情報を取得

        Args:
            child_id: 子どもID

        Returns:
            子ども情報 or None
        """
        try:
            result = self.client.table('children').select('*').eq(
                'id', child_id
            ).single().execute()

            return result.data
        except Exception as e:
            logger.error(f"子ども取得エラー: {e}")
            return None

    def add_record(self, child_id: str, action_id: str, points: int) -> bool:
        """
        行動記録を追加

        Args:
            child_id: 子どもID
            action_id: 行動ID
            points: ポイント

        Returns:
            成功時True
        """
        try:
            self.client.table('records').insert({
                'child_id': child_id,
                'action_id': action_id,
                'points': points,
                'source': 'line'
            }).execute()

            logger.info(f"記録追加: action={action_id}, points={points}, child={child_id}")
            return True
        except Exception as e:
            logger.error(f"記録追加エラー: {e}")
            return False

    def update_child_points(self, child_id: str, points_to_add: int, reward_threshold: int = 100) -> dict:
        """
        子どものポイントを更新

        Args:
            child_id: 子どもID
            points_to_add: 追加ポイント
            reward_threshold: ごほうび閾値

        Returns:
            更新後の情報 {'total_points': int, 'cycle_points': int, 'reward_achieved': bool}
        """
        try:
            # 現在のポイントを取得
            child = self.get_child(child_id)
            if not child:
                return None

            new_total = child['total_points'] + points_to_add
            new_cycle = child['cycle_points'] + points_to_add
            reward_achieved = False

            # ごほうび達成チェック
            if new_cycle >= reward_threshold:
                reward_achieved = True
                new_cycle -= reward_threshold

            # 更新
            self.client.table('children').update({
                'total_points': new_total,
                'cycle_points': new_cycle
            }).eq('id', child_id).execute()

            logger.info(f"ポイント更新: {child_id} - total={new_total}, cycle={new_cycle}")

            return {
                'total_points': new_total,
                'cycle_points': new_cycle,
                'reward_achieved': reward_achieved
            }
        except Exception as e:
            logger.error(f"ポイント更新エラー: {e}")
            return None

    def get_today_records(self, child_id: str) -> list:
        """
        今日の記録を取得

        Args:
            child_id: 子どもID

        Returns:
            今日の記録リスト
        """
        try:
            today = datetime.now().strftime('%Y-%m-%d')

            result = self.client.table('records').select(
                '*, actions(name, points)'
            ).eq('child_id', child_id).gte(
                'recorded_at', f'{today}T00:00:00'
            ).lte(
                'recorded_at', f'{today}T23:59:59'
            ).execute()

            return result.data or []
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
            points = record['points']
            action_name = record.get('actions', {}).get('name', '不明')
            total_points += points
            action_counts[action_name] = action_counts.get(action_name, 0) + 1

        return {
            'total_points': total_points,
            'actions': action_counts
        }

    def get_goals(self, family_id: str) -> list:
        """
        家庭の目標リストを取得

        Args:
            family_id: 家庭ID

        Returns:
            目標リスト
        """
        try:
            result = self.client.table('goals').select('*').eq(
                'family_id', family_id
            ).eq('is_achieved', False).order('display_order').execute()

            return result.data or []
        except Exception as e:
            logger.error(f"目標取得エラー: {e}")
            return []
