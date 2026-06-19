"""
Testes unitários de validação de schemas (sem banco de dados).
Testam as regras de negócio dos modelos Pydantic diretamente.
"""
import pytest
from pydantic import ValidationError

from app.modulos.auth.schemas import (
    LoginInput,
    RecuperarSenhaInput,
    RedefinirSenhaInput,
    RefreshInput,
    RegistrarSalaoInput,
)


class TestRegistrarSalaoInput:
    """Testes de validação do schema de registro de salão."""

    def test_dados_validos_passa(self):
        """Schema válido deve ser instanciado sem erros."""
        dados = RegistrarSalaoInput(
            nome_salao="Salão Belezzi",
            telefone_salao="(11) 98765-4321",
            cidade="São Paulo",
            estado="SP",
            nome_owner="Lucas Arruda",
            email_owner="lucas@belezzi.com.br",
            senha="SenhaSegura123!",
            confirmar_senha="SenhaSegura123!",
        )
        assert dados.nome_salao == "Salão Belezzi"
        assert dados.estado == "SP"

    def test_senhas_diferentes_levanta_excecao(self):
        """Senhas divergentes devem levantar ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            RegistrarSalaoInput(
                nome_salao="Salão Belezzi",
                telefone_salao="(11) 98765-4321",
                cidade="São Paulo",
                estado="SP",
                nome_owner="Lucas Arruda",
                email_owner="lucas@belezzi.com.br",
                senha="SenhaSegura123!",
                confirmar_senha="SenhaDiferente456!",
            )
        assert "senhas" in str(exc_info.value).lower() or "confirmar" in str(exc_info.value).lower()

    def test_nome_salao_muito_curto_levanta_excecao(self):
        """Nome do salão com menos de 2 caracteres deve falhar."""
        with pytest.raises(ValidationError):
            RegistrarSalaoInput(
                nome_salao="A",
                telefone_salao="(11) 98765-4321",
                cidade="São Paulo",
                estado="SP",
                nome_owner="Lucas Arruda",
                email_owner="lucas@belezzi.com.br",
                senha="SenhaSegura123!",
                confirmar_senha="SenhaSegura123!",
            )

    def test_estado_com_mais_de_2_chars_levanta_excecao(self):
        """Estado com mais de 2 caracteres deve falhar."""
        with pytest.raises(ValidationError):
            RegistrarSalaoInput(
                nome_salao="Salão Belezzi",
                telefone_salao="(11) 98765-4321",
                cidade="São Paulo",
                estado="SPP",
                nome_owner="Lucas Arruda",
                email_owner="lucas@belezzi.com.br",
                senha="SenhaSegura123!",
                confirmar_senha="SenhaSegura123!",
            )

    def test_email_owner_invalido_levanta_excecao(self):
        """Email do proprietário malformado deve falhar."""
        with pytest.raises(ValidationError):
            RegistrarSalaoInput(
                nome_salao="Salão Belezzi",
                telefone_salao="(11) 98765-4321",
                cidade="São Paulo",
                estado="SP",
                nome_owner="Lucas Arruda",
                email_owner="nao-e-um-email",
                senha="SenhaSegura123!",
                confirmar_senha="SenhaSegura123!",
            )

    def test_senha_muito_curta_levanta_excecao(self):
        """Senha com menos de 8 caracteres deve falhar."""
        with pytest.raises(ValidationError):
            RegistrarSalaoInput(
                nome_salao="Salão Belezzi",
                telefone_salao="(11) 98765-4321",
                cidade="São Paulo",
                estado="SP",
                nome_owner="Lucas Arruda",
                email_owner="lucas@belezzi.com.br",
                senha="abc",
                confirmar_senha="abc",
            )

    def test_email_salao_opcional_aceita_none(self):
        """email_salao é opcional e aceita None."""
        dados = RegistrarSalaoInput(
            nome_salao="Salão Belezzi",
            telefone_salao="(11) 98765-4321",
            cidade="São Paulo",
            estado="SP",
            nome_owner="Lucas Arruda",
            email_owner="lucas@belezzi.com.br",
            senha="SenhaSegura123!",
            confirmar_senha="SenhaSegura123!",
        )
        assert dados.email_salao is None

    def test_endereco_salao_aceita_string_vazia(self):
        """endereco_salao tem default vazio e não é obrigatório."""
        dados = RegistrarSalaoInput(
            nome_salao="Salão Belezzi",
            telefone_salao="(11) 98765-4321",
            cidade="São Paulo",
            estado="SP",
            nome_owner="Lucas Arruda",
            email_owner="lucas@belezzi.com.br",
            senha="SenhaSegura123!",
            confirmar_senha="SenhaSegura123!",
        )
        assert dados.endereco_salao == ""


class TestLoginInput:
    """Testes de validação do schema de login."""

    def test_login_valido_passa(self):
        """Dados de login válidos devem ser aceitos."""
        login = LoginInput(email="lucas@belezzi.com.br", senha="SenhaSegura123!")
        assert login.email == "lucas@belezzi.com.br"

    def test_login_email_invalido_levanta_excecao(self):
        """Email malformado deve falhar."""
        with pytest.raises(ValidationError):
            LoginInput(email="nao-email", senha="SenhaSegura123!")

    def test_login_sem_senha_levanta_excecao(self):
        """Ausência de senha deve levantar ValidationError."""
        with pytest.raises(ValidationError):
            LoginInput(email="lucas@belezzi.com.br")


class TestRefreshInput:
    """Testes de validação do schema de refresh token."""

    def test_refresh_valido_passa(self):
        """Token de refresh qualquer deve ser aceito pelo schema."""
        refresh = RefreshInput(refresh_token="qualquer-token-string")
        assert refresh.refresh_token == "qualquer-token-string"

    def test_refresh_sem_token_levanta_excecao(self):
        """Ausência do campo refresh_token deve falhar."""
        with pytest.raises(ValidationError):
            RefreshInput()


class TestRecuperarSenhaInput:
    """Testes de validação do schema de recuperação de senha."""

    def test_email_valido_passa(self):
        """Email válido deve ser aceito."""
        input_data = RecuperarSenhaInput(email="lucas@belezzi.com.br")
        assert input_data.email == "lucas@belezzi.com.br"

    def test_email_invalido_levanta_excecao(self):
        """Email malformado deve falhar."""
        with pytest.raises(ValidationError):
            RecuperarSenhaInput(email="nao-email")


class TestRedefinirSenhaInput:
    """Testes de validação do schema de redefinição de senha."""

    def test_dados_validos_passam(self):
        """Token e nova senha válidos devem ser aceitos."""
        input_data = RedefinirSenhaInput(
            token="token-de-recuperacao",
            nova_senha="NovaSenha123!",
        )
        assert input_data.token == "token-de-recuperacao"

    def test_nova_senha_curta_levanta_excecao(self):
        """Nova senha com menos de 8 caracteres deve falhar."""
        with pytest.raises(ValidationError):
            RedefinirSenhaInput(token="token-qualquer", nova_senha="abc")
