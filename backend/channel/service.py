from backend.channel.domain import Channel
from backend.channel.repository import ChannelRepository
from backend.common.slack_api import SlackAPI
from backend.mail.domain import Mail
from backend.mail.repository import MailRepository
from backend.user.domain import User
from backend.user.repository import UserRepository


class ChannelDTO:
    def __init__(self, channel: Channel) -> None:
        self.team_name = channel.team_name


class ChannelService:
    def __init__(self) -> None:
        self.mail_repository = MailRepository()
        self.user_repository = UserRepository()
        self.channel_repository = ChannelRepository()
        self.slack_api = SlackAPI()

    def add(self, code, user_id):
        channel = self.slack_api.install(code, user_id)
        self.channel_repository.Create(channel).run()

    def read(self, user_id):
        channel_list = list()
        channels = self.channel_repository.ReadByUserID(user_id).run()
        for channel in channels:
            channel_list.append(ChannelDTO(channel))
        return channel_list
