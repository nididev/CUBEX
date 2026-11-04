from sqlalchemy import create_engine, text
from app.config import settings

if not settings.DATABASE_URL:
    raise RuntimeError("Falta configurar DATABASE_URL en el archivo .env")

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

def obtener_pedido_completo(id_pedido: int):
    """Lee el pedido y sus productos desde el esquema actual de CUBEX."""
    with engine.connect() as conn:
        pedido = conn.execute(text("""
            SELECT p.id, p.id_cliente, p.fecha, p.estado
            FROM pedidos p
            WHERE p.id = :id
            LIMIT 1
        """), {"id": id_pedido}).mappings().first()

        if not pedido:
            return None, []

        detalles = conn.execute(text("""
            SELECT dc.cantidad, pr.nombre AS producto,
                   pr.precio AS precio_unitario
            FROM pedidos p
            INNER JOIN carrito c ON c.id = p.id_carrito
            INNER JOIN detalle_carrito dc ON dc.id_carrito = c.id
            INNER JOIN productos pr ON pr.id = dc.id_producto
            WHERE p.id = :id
            ORDER BY dc.id
        """), {"id": id_pedido}).mappings().all()

        return dict(pedido), [dict(x) for x in detalles]
