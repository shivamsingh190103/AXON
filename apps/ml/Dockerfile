FROM python:3.11-slim

WORKDIR /app

COPY apps/ml/requirements.txt ./apps/ml/requirements.txt
RUN pip install --no-cache-dir -r ./apps/ml/requirements.txt

COPY . /app

WORKDIR /app/apps/ml
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
