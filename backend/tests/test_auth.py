import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


class TestRegistro:
    """Testes para o endpoint POST /api/v1/auth/register."""

    async def test_registro_salao_sucesso(self, client: AsyncClient, dados_registro: dict):
        """Registrar um novo salão deve retornar 201 com tokens JWT."""
        response = await client.post("/api/v1/auth/register", json=dados_registro)

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["usuario"]["email"] == dados_registro["email_owner"]
        assert data["usuario"]["role"] == "owner"
        assert data["usuario"]["is_active"] is True

    async def test_registro_senhas_diferentes_falha(
        self, client: AsyncClient, dados_registro: dict
    ):
        """Senhas divergentes devem retornar 422."""
        dados_registro["confirmar_senha"] = "SenhaDiferente456!"
        response = await client.post("/api/v1/auth/register", json=dados_registro)

        assert response.status_code == 422

    async def test_registro_email_invalido_falha(
        self, client: AsyncClient, dados_registro: dict
    ):
        """Email inválido deve retornar 422."""
        dados_registro["email_owner"] = "email-invalido-sem-arroba"
        response = await client.post("/api/v1/auth/register", json=dados_registro)

        assert response.status_code == 422

    async def test_registro_senha_curta_falha(
        self, client: AsyncClient, dados_registro: dict
    ):
        """Senha com menos de 8 caracteres deve retornar 422."""
        dados_registro["senha"] = "123"
        dados_registro["confirmar_senha"] = "123"
        response = await client.post("/api/v1/auth/register", json=dados_registro)

        assert response.status_code == 422

    async def test_registro_nome_salao_vazio_falha(
        self, client: AsyncClient, dados_registro: dict
    ):
        """Nome do salão vazio deve retornar 422."""
        dados_registro["nome_salao"] = ""
        response = await client.post("/api/v1/auth/register", json=dados_registro)

        assert response.status_code == 422

    async def test_registro_estado_invalido_falha(
        self, client: AsyncClient, dados_registro: dict
    ):
        """Estado com mais de 2 caracteres deve retornar 422."""
        dados_registro["estado"] = "SPP"  # deve ter exatamente 2 chars
        response = await client.post("/api/v1/auth/register", json=dados_registro)

        assert response.status_code == 422


class TestLogin:
    """Testes para o endpoint POST /api/v1/auth/login."""

    async def test_login_sucesso(self, client: AsyncClient, dados_registro: dict):
        """Login com credenciais corretas deve retornar tokens JWT."""
        # Primeiro registrar
        await client.post("/api/v1/auth/register", json=dados_registro)

        # Depois logar
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": dados_registro["email_owner"],
                "senha": dados_registro["senha"],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_senha_errada_falha(
        self, client: AsyncClient, dados_registro: dict
    ):
        """Senha incorreta deve retornar 401."""
        # Registrar
        await client.post("/api/v1/auth/register", json=dados_registro)

        # Tentar logar com senha errada
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": dados_registro["email_owner"],
                "senha": "SenhaErrada999!",
            },
        )

        assert response.status_code == 401

    async def test_login_email_nao_cadastrado_falha(self, client: AsyncClient):
        """Email não existente deve retornar 401."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "naoexiste@belezzi.com.br",
                "senha": "SenhaQualquer123!",
            },
        )

        assert response.status_code == 401

    async def test_login_email_invalido_falha(self, client: AsyncClient):
        """Email malformado deve retornar 422."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nao-e-email",
                "senha": "SenhaQualquer123!",
            },
        )

        assert response.status_code == 422


class TestRefreshToken:
    """Testes para o endpoint POST /api/v1/auth/refresh."""

    async def test_refresh_token_invalido_falha(self, client: AsyncClient):
        """Refresh token inválido deve retornar 401."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "token-invalido-qualquer"},
        )

        assert response.status_code == 401

    async def test_refresh_token_ausente_falha(self, client: AsyncClient):
        """Requisição sem refresh token deve retornar 422."""
        response = await client.post("/api/v1/auth/refresh", json={})

        assert response.status_code == 422
