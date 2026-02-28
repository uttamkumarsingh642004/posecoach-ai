FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv --no-cache-dir

# Copy and install requirements
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Pre-download YOLO model
RUN python -c "from ultralytics import YOLO; YOLO('yolo11n-pose.pt')"

# Copy all source files
COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]