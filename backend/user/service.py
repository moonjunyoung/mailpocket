from backend.common.exceptions import IdentifierNotFoundException
from backend.user.domain import User
from backend.user.repository import UserRepository


class UserService:
    def __init__(self) -> None:
        self.user_repository = UserRepository()

    def sign_up(self, identifier, password):
        user = User(
            id=None,
            identifier=identifier,
            password=password,
        )
        if self.user_repository.ReadByIdentifier(identifier=user.identifier).run():
            user.identifier_is_not_unique()
        user.password_encryption()
        self.user_repository.Create(user).run()
        return user.id

    def sign_in(self, identifier, password):
        user: User = self.user_repository.ReadByIdentifier(identifier).run()
        if not user:
            raise IdentifierNotFoundException(identifier=identifier)
        user.check_password_match(password)
        return user.id

    def read(self, user_id):
        user: User = self.user_repository.ReadByID(user_id).run()
        del user.password
        return user

    def oauth_login(self, platform_id, platform):
        user = User(
            id=None,
            platform_id=platform_id,
            platform=platform,
        )
        existing_user: User = self.user_repository.ReadUserByPlatformID(
            platform_id=user.platform_id,
            platform=user.platform,
        ).run()
        if existing_user:
            return existing_user.id
        self.user_repository.Create(user).run()
        return user.id
