FROM python:3.11-slim

WORKDIR /app

# Instala dependências primeiro para aproveitar cache do Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código
COPY . .

# Porta usada pela aplicação
EXPOSE 8080

# Sobe com gunicorn (produção) em vez do servidor de desenvolvimento do Flask
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "app:app"]
