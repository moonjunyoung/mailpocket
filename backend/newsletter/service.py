from backend.newsletter.domain import NewsLetter
from backend.newsletter.repository import NewsLetterRepository
from backend.user.domain import User
from backend.user.repository import UserRepository


class NewsLetterlDTO:
    def __init__(self, newsletter: NewsLetter) -> None:
        self.id = newsletter.id
        self.name = newsletter.name
        self.category = newsletter.category


class NewsLetterService:
    def __init__(self) -> None:
        self.newsletter_repository = NewsLetterRepository()
        self.user_repository = UserRepository()

    def get_all_newsletters(self):
        newsletter_list = list()
        newsletters = self.newsletter_repository.LoadNewsletters().run()
        for newsletter in newsletters:
            newsletter_list.append(NewsLetterlDTO(newsletter))
        return newsletter_list

    def subscribe(self, user_id, newsletter_ids):
        user = self.user_repository.ReadByID(user_id).run()
        self.user_repository.DeleteUserNewslettersMapping(user).run()
        self.user_repository.CreateUserNewslettersMapping(user, newsletter_ids).run()

    def get_subscribe_newsletters(self, user_id):
        newsletter_list = list()
        user = self.user_repository.ReadByID(user_id).run()
        newsletters = self.newsletter_repository.LoadSubscribeNewsLettersByUser(
            user
        ).run()
        if newsletters:
            for newsletter in newsletters:
                newsletter_list.append(NewsLetterlDTO(newsletter))
        return newsletter_list
