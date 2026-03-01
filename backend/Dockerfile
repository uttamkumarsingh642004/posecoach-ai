FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libglib2.0-0 libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv --no-cache-dir

COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]