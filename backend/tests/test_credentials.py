from backend.app.services.credentials import CredentialService


def test_encrypts_and_decrypts_credentials():
    original = "APP_USR-super-secret-token"
    encrypted = CredentialService.encrypt(original)

    assert encrypted.startswith("enc:")
    assert original not in encrypted
    assert CredentialService.decrypt(encrypted) == original


def test_keeps_legacy_plaintext_credentials_readable():
    assert CredentialService.decrypt("legacy-token") == "legacy-token"


def test_does_not_encrypt_twice():
    encrypted = CredentialService.encrypt("secret")
    assert CredentialService.encrypt(encrypted) == encrypted
