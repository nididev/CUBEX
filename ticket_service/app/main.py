import io
import uuid
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape
from xhtml2pdf import pisa

from app.config import settings
from app.database import obtener_pedido_completo

app = FastAPI(
    title="CUBEX - Servicio de tickets",
    version="2.0.0",
    description="Genera tickets PDF de pedidos confirmados de CUBEX."
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)

BASE_DIR = Path(__file__).resolve().parent
env = Environment(
    loader=FileSystemLoader(BASE_DIR / "templates"),
    autoescape=select_autoescape(["html", "xml"])
)

@app.get("/api/salud")
def salud():
    return {"exitoso": True, "mensaje": "Servicio de tickets CUBEX funcionando", "puerto": settings.APP_PORT}

@app.get("/api/tickets/{id_pedido}")
def generar_ticket(id_pedido: int):
    pedido, detalles = obtener_pedido_completo(id_pedido)
    if not pedido:
        raise HTTPException(status_code=404, detail="El pedido no existe.")

    estado = str(pedido.get("estado") or "").strip().lower()
   
    if not detalles:
        raise HTTPException(status_code=409, detail="El pedido no tiene productos registrados.")

    folio = f"CUBEX-{datetime.now().strftime('%Y%m%d')}-{id_pedido:05d}-{uuid.uuid4().hex[:4].upper()}"
    fecha = pedido["fecha"]
    if hasattr(fecha, "strftime"):
        fecha_texto = fecha.strftime("%d/%m/%Y %H:%M")
    else:
        fecha_texto = str(fecha)

    items = []
    total = Decimal("0.00")
    for item in detalles:
        cantidad = int(item["cantidad"])
        precio = Decimal(str(item["precio_unitario"] or 0))
        importe = precio * cantidad
        total += importe
        items.append({
            "cantidad": cantidad,
            "producto": str(item["producto"]),
            "precio_unitario": float(precio),
            "importe": float(importe)
        })

    template = env.get_template("ticket_template.html")
    html = template.render(
        folio=folio,
        fecha=fecha_texto,
        pedido_id=id_pedido,
        cliente_nombre=f"Cliente #{pedido['id_cliente']}",
        items=items,
        total=float(total)
    )
    buffer = io.BytesIO()
    resultado = pisa.CreatePDF(io.StringIO(html), dest=buffer, encoding="utf-8")
    if resultado.err:
        raise HTTPException(status_code=500, detail="No se pudo generar el PDF del ticket.")
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ticket-CUBEX-{id_pedido}.pdf"'}
    )
