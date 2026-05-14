"""
Script de seed: popula o banco com dados realistas para desenvolvimento.

Cria:
  - 1 salão ("Salão Bella Vita")
  - 1 usuário owner
  - 6 profissionais
  - 12 serviços (cabelo, unhas, estética)
  - 50 clientes
  - ~120 agendamentos distribuídos nos últimos 90 dias e próximos 30 dias

Uso:
  docker compose exec backend python scripts/seed.py
  # ou localmente:
  cd backend && python scripts/seed.py
"""

import asyncio
import random
import sys
import os
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

# Garante que o backend está no path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.seguranca import hash_senha
from app.modulos.agendamentos.model import Appointment
from app.modulos.clientes.model import Client
from app.modulos.financeiro.model import FinancialTransaction
from app.modulos.profissionais.model import Professional
from app.modulos.salao.model import Salon
from app.modulos.servicos.model import Service
from app.modulos.usuarios.model import User

# ---------------------------------------------------------------------------
# Dados de referência
# ---------------------------------------------------------------------------

NOMES_FEMININOS = [
    "Ana Silva", "Beatriz Santos", "Camila Oliveira", "Daniela Costa", "Eduarda Lima",
    "Fernanda Souza", "Gabriela Ferreira", "Helena Rodrigues", "Isabela Alves", "Juliana Mendes",
    "Karla Pereira", "Larissa Gomes", "Mariana Barbosa", "Natália Ribeiro", "Olívia Carvalho",
    "Patrícia Dias", "Rafaela Moreira", "Sabrina Nunes", "Tatiana Cardoso", "Vanessa Moraes",
    "Amanda Teixeira", "Bruna Cunha", "Cíntia Pinto", "Débora Araújo", "Elaine Vieira",
    "Flávia Monteiro", "Giovana Ramos", "Hellen Castro", "Ingrid Cavalcante", "Joana Borges",
    "Kátia Freitas", "Letícia Andrade", "Mônica Correia", "Núbia Sales", "Odalys Nascimento",
    "Priscila Lopes", "Renata Magalhães", "Simone Farias", "Thais Rezende", "Ursula Martins",
    "Valéria Coelho", "Wanessa Campos", "Xênia Leite", "Yasmin Queiroz", "Zenaide Azevedo",
    "Adriana Rocha", "Cristina Peixoto", "Elisangela Sena", "Luiza Santana", "Miriam Guedes",
]

PROFISSIONAIS = [
    {"name": "Aline Teixeira", "specialty": "Cabelereiro", "commission_percentage": 45.0, "color": "#f43f5e"},
    {"name": "Brenda Melo", "specialty": "Manicure e Pedicure", "commission_percentage": 40.0, "color": "#8b5cf6"},
    {"name": "Carla Duarte", "specialty": "Estética Facial", "commission_percentage": 50.0, "color": "#06b6d4"},
    {"name": "Diego Santos", "specialty": "Barbeiro", "commission_percentage": 45.0, "color": "#f97316"},
    {"name": "Estela Ramos", "specialty": "Depilação", "commission_percentage": 40.0, "color": "#10b981"},
    {"name": "Fábio Costa", "specialty": "Cabelereiro", "commission_percentage": 45.0, "color": "#3b82f6"},
]

SERVICOS = [
    {"name": "Corte Feminino", "category": "Cabelo", "duration_minutes": 60, "price": Decimal("80.00"), "commission_type": "percentage", "commission_value": Decimal("45"), "color": "#f43f5e"},
    {"name": "Corte Masculino", "category": "Cabelo", "duration_minutes": 30, "price": Decimal("45.00"), "commission_type": "percentage", "commission_value": Decimal("45"), "color": "#3b82f6"},
    {"name": "Escova Progressiva", "category": "Cabelo", "duration_minutes": 180, "price": Decimal("280.00"), "commission_type": "percentage", "commission_value": Decimal("45"), "color": "#f43f5e"},
    {"name": "Coloração", "category": "Cabelo", "duration_minutes": 120, "price": Decimal("150.00"), "commission_type": "percentage", "commission_value": Decimal("45"), "color": "#3b82f6"},
    {"name": "Manicure", "category": "Unhas", "duration_minutes": 45, "price": Decimal("35.00"), "commission_type": "percentage", "commission_value": Decimal("40"), "color": "#8b5cf6"},
    {"name": "Pedicure", "category": "Unhas", "duration_minutes": 60, "price": Decimal("45.00"), "commission_type": "percentage", "commission_value": Decimal("40"), "color": "#8b5cf6"},
    {"name": "Gel nas Unhas", "category": "Unhas", "duration_minutes": 90, "price": Decimal("90.00"), "commission_type": "percentage", "commission_value": Decimal("40"), "color": "#8b5cf6"},
    {"name": "Limpeza de Pele", "category": "Estética", "duration_minutes": 60, "price": Decimal("120.00"), "commission_type": "percentage", "commission_value": Decimal("50"), "color": "#06b6d4"},
    {"name": "Hidratação Facial", "category": "Estética", "duration_minutes": 45, "price": Decimal("80.00"), "commission_type": "percentage", "commission_value": Decimal("50"), "color": "#06b6d4"},
    {"name": "Depilação Pernas", "category": "Depilação", "duration_minutes": 45, "price": Decimal("70.00"), "commission_type": "percentage", "commission_value": Decimal("40"), "color": "#10b981"},
    {"name": "Depilação Axilas", "category": "Depilação", "duration_minutes": 20, "price": Decimal("30.00"), "commission_type": "percentage", "commission_value": Decimal("40"), "color": "#10b981"},
    {"name": "Barba Completa", "category": "Barba", "duration_minutes": 30, "price": Decimal("35.00"), "commission_type": "percentage", "commission_value": Decimal("45"), "color": "#f97316"},
]

# Mapeamento specialty -> índices de serviços compatíveis
ESPECIALIDADE_SERVICOS = {
    "Cabelereiro": [0, 2, 3],     # Corte Feminino, Progressiva, Coloração
    "Manicure e Pedicure": [4, 5, 6],
    "Estética Facial": [7, 8],
    "Barbeiro": [1, 11],           # Corte Masculino, Barba
    "Depilação": [9, 10],
}

STATUS_PASSADO = ["completed", "completed", "completed", "cancelled", "no_show"]
STATUS_FUTURO = ["scheduled", "scheduled", "confirmed", "confirmed", "scheduled"]

METODOS_PAGAMENTO = ["pix", "credit_card", "debit_card", "cash", "pix", "pix"]
COMO_CONHECEU = ["indicação", "instagram", "google", "passou na rua", "whatsapp", "tiktok"]


def _data_aleatoria_passada(dias_max=90) -> date:
    delta = random.randint(1, dias_max)
    return date.today() - timedelta(days=delta)


def _data_aleatoria_futura(dias_max=30) -> date:
    delta = random.randint(1, dias_max)
    return date.today() + timedelta(days=delta)


def _horario_comercial() -> time:
    hora = random.randint(8, 18)
    minuto = random.choice([0, 30])
    return time(hora, minuto)


def _calcular_fim(inicio: time, duracao: int) -> time:
    dt = datetime.combine(date.today(), inicio) + timedelta(minutes=duracao)
    return dt.time()


# ---------------------------------------------------------------------------
# Seed principal
# ---------------------------------------------------------------------------

async def seed(db: AsyncSession):
    print("🌱 Iniciando seed...")

    # Verifica se já existe
    existente = await db.scalar(select(Salon).where(Salon.slug == "bella-vita"))
    if existente:
        print("⚠️  Seed já executado (salão 'bella-vita' já existe). Abortando.")
        return

    # ------------------------------------------------------------------
    # Salão
    # ------------------------------------------------------------------
    salao = Salon(
        name="Salão Bella Vita",
        slug="bella-vita",
        phone="(11) 3456-7890",
        email="contato@bellavita.com.br",
        address="Rua das Flores, 123",
        city="São Paulo",
        state="SP",
        opening_time=time(8, 0),
        closing_time=time(20, 0),
        working_days=[1, 2, 3, 4, 5, 6],
        slot_duration_minutes=30,
        allow_online_booking=True,
    )
    db.add(salao)
    await db.flush()
    print(f"  ✅ Salão criado: {salao.name} (id={salao.id})")

    # ------------------------------------------------------------------
    # Usuário owner
    # ------------------------------------------------------------------
    owner = User(
        salon_id=salao.id,
        name="Marina Proprietária",
        email="owner@bellavita.com.br",
        password_hash=hash_senha("Senha@1234"),
        role="owner",
    )
    db.add(owner)
    await db.flush()
    print(f"  ✅ Owner criado: {owner.email} / senha: Senha@1234")

    # ------------------------------------------------------------------
    # Profissionais
    # ------------------------------------------------------------------
    profissionais = []
    for dados in PROFISSIONAIS:
        prof = Professional(
            salon_id=salao.id,
            name=dados["name"],
            phone=f"(11) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}",
            specialty=dados["specialty"],
            commission_percentage=dados["commission_percentage"],
            color=dados["color"],
        )
        db.add(prof)
        profissionais.append(prof)
    await db.flush()
    print(f"  ✅ {len(profissionais)} profissionais criados")

    # ------------------------------------------------------------------
    # Serviços
    # ------------------------------------------------------------------
    servicos = []
    for dados in SERVICOS:
        serv = Service(
            salon_id=salao.id,
            name=dados["name"],
            category=dados["category"],
            duration_minutes=dados["duration_minutes"],
            price=dados["price"],
            commission_type=dados["commission_type"],
            commission_value=dados["commission_value"],
            color=dados["color"],
        )
        db.add(serv)
        servicos.append(serv)
    await db.flush()
    print(f"  ✅ {len(servicos)} serviços criados")

    # ------------------------------------------------------------------
    # Clientes
    # ------------------------------------------------------------------
    clientes = []
    telefones = [
        f"(11) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}" for _ in range(50)
    ]
    for i, nome in enumerate(NOMES_FEMININOS):
        cliente = Client(
            salon_id=salao.id,
            name=nome,
            phone=telefones[i],
            how_met=random.choice(COMO_CONHECEU),
        )
        db.add(cliente)
        clientes.append(cliente)
    await db.flush()
    print(f"  ✅ {len(clientes)} clientes criados")

    # ------------------------------------------------------------------
    # Agendamentos — passados (90 dias atrás até ontem)
    # ------------------------------------------------------------------
    agendamentos_criados = 0
    transacoes_criadas = 0

    # Controle de conflitos: {(prof_id, data): [(inicio, fim)]}
    ocupacao: dict[tuple, list] = {}

    def _tem_conflito(prof_id, data, inicio, fim) -> bool:
        chave = (prof_id, data)
        for s, e in ocupacao.get(chave, []):
            if inicio < e and fim > s:
                return True
        return False

    def _registrar(prof_id, data, inicio, fim):
        chave = (prof_id, data)
        ocupacao.setdefault(chave, []).append((inicio, fim))

    # 100 agendamentos passados
    tentativas = 0
    while agendamentos_criados < 100 and tentativas < 2000:
        tentativas += 1
        prof = random.choice(profissionais)
        servicos_prof = ESPECIALIDADE_SERVICOS.get(prof.specialty, list(range(len(servicos))))
        serv = servicos[random.choice(servicos_prof)]

        data = _data_aleatoria_passada(90)
        inicio = _horario_comercial()
        fim = _calcular_fim(inicio, serv.duration_minutes)

        if _tem_conflito(prof.id, data, inicio, fim):
            continue

        _registrar(prof.id, data, inicio, fim)

        status = random.choice(STATUS_PASSADO)
        desconto = Decimal("0")
        if random.random() < 0.1:
            desconto = Decimal(str(random.choice([5, 10, 15, 20])))
        preco_final = max(Decimal("0"), serv.price - desconto)
        metodo = random.choice(METODOS_PAGAMENTO)
        cliente = random.choice(clientes)

        agend = Appointment(
            salon_id=salao.id,
            client_id=cliente.id,
            professional_id=prof.id,
            service_id=serv.id,
            scheduled_date=data,
            start_time=inicio,
            end_time=fim,
            status=status,
            price=serv.price,
            discount=desconto,
            final_price=preco_final,
            payment_status="paid" if status == "completed" else "pending",
            payment_method=metodo if status == "completed" else None,
            created_by_id=owner.id,
        )
        if status == "cancelled":
            agend.cancelled_at = datetime.now(timezone.utc)
            agend.cancellation_reason = random.choice([
                "Cliente desmarcou", "Profissional indisponível", "Emergência familiar"
            ])
        db.add(agend)
        agendamentos_criados += 1

        # Atualiza métricas do cliente
        if status == "completed":
            cliente.visit_count += 1
            cliente.total_spent += preco_final
            if not cliente.last_visit_date or data > cliente.last_visit_date:
                cliente.last_visit_date = data

            # Transação financeira para agendamentos concluídos
            transacao = FinancialTransaction(
                salon_id=salao.id,
                appointment_id=agend.id,
                professional_id=prof.id,
                type="income",
                category="Serviços",
                description=f"{serv.name} - {cliente.name}",
                amount=preco_final,
                payment_method=metodo,
                transaction_date=data,
                created_by_id=owner.id,
            )
            db.add(transacao)
            transacoes_criadas += 1

    await db.flush()
    print(f"  ✅ {agendamentos_criados} agendamentos passados criados")
    print(f"  ✅ {transacoes_criadas} transações financeiras criadas")

    # ------------------------------------------------------------------
    # Agendamentos — futuros (próximos 30 dias)
    # ------------------------------------------------------------------
    agend_futuros = 0
    tentativas = 0
    while agend_futuros < 25 and tentativas < 500:
        tentativas += 1
        prof = random.choice(profissionais)
        servicos_prof = ESPECIALIDADE_SERVICOS.get(prof.specialty, list(range(len(servicos))))
        serv = servicos[random.choice(servicos_prof)]

        data = _data_aleatoria_futura(30)
        inicio = _horario_comercial()
        fim = _calcular_fim(inicio, serv.duration_minutes)

        if _tem_conflito(prof.id, data, inicio, fim):
            continue

        _registrar(prof.id, data, inicio, fim)

        status = random.choice(STATUS_FUTURO)
        cliente = random.choice(clientes)

        agend = Appointment(
            salon_id=salao.id,
            client_id=cliente.id,
            professional_id=prof.id,
            service_id=serv.id,
            scheduled_date=data,
            start_time=inicio,
            end_time=fim,
            status=status,
            price=serv.price,
            discount=Decimal("0"),
            final_price=serv.price,
            payment_status="pending",
            created_by_id=owner.id,
        )
        db.add(agend)
        agend_futuros += 1

    await db.flush()
    print(f"  ✅ {agend_futuros} agendamentos futuros criados")

    # ------------------------------------------------------------------
    # Despesas fixas do salão (últimos 3 meses)
    # ------------------------------------------------------------------
    despesas = [
        ("Aluguel", "expense", "Infraestrutura", Decimal("3500.00"), "bank_transfer"),
        ("Luz e Água", "expense", "Infraestrutura", Decimal("380.00"), "bank_transfer"),
        ("Produtos e Insumos", "expense", "Estoque", Decimal("1200.00"), "pix"),
        ("Material de Limpeza", "expense", "Higiene", Decimal("150.00"), "cash"),
        ("Internet e Telefone", "expense", "Infraestrutura", Decimal("220.00"), "bank_transfer"),
    ]
    despesas_criadas = 0
    for mes_delta in range(3):
        dia_ref = date.today().replace(day=5) - timedelta(days=30 * mes_delta)
        for desc, tipo, cat, valor, metodo in despesas:
            transacao = FinancialTransaction(
                salon_id=salao.id,
                type=tipo,
                category=cat,
                description=desc,
                amount=valor,
                payment_method=metodo,
                transaction_date=dia_ref,
                created_by_id=owner.id,
            )
            db.add(transacao)
            despesas_criadas += 1

    await db.flush()
    print(f"  ✅ {despesas_criadas} despesas fixas criadas")

    await db.commit()

    print("\n✅ Seed concluído com sucesso!")
    print(f"   Salão ID: {salao.id}")
    print(f"   Login: owner@bellavita.com.br / Senha@1234")
    print(f"   Total agendamentos: {agendamentos_criados + agend_futuros}")


async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await seed(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
