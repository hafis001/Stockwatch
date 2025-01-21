# stockwatch.py

import requests
from django.core.management.base import BaseCommand
from django.db import models
from django.shortcuts import render
from django.conf import settings
from django.urls import path
from django.http import HttpResponse
from django.core.management import execute_from_command_line
import os
import sys

# Settings
settings.configure(
    DEBUG=True,
    SECRET_KEY='your-secret-key',
    ROOT_URLCONF=__name__,
    MIDDLEWARE=[
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ],
    INSTALLED_APPS=[
        'django.contrib.contenttypes',
        'django.contrib.staticfiles',
        'stocks',
    ],
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(os.path.dirname(__file__), 'db.sqlite3'),
        }
    },
    STATIC_URL='/static/',
)

# Models
class Stock(models.Model):
    symbol = models.CharField(max_length=10)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

# Views
def index(request):
    stocks = Stock.objects.all()
    return render(request, 'index.html', {'stocks': stocks})

# URL Configuration
urlpatterns = [
    path('', index),
]

# Templates
TEMPLATES = {
    'index.html': """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stock Watch</title>
    </head>
    <body>
        <h1>Stock Watch</h1>
        <ul>
            {% for stock in stocks %}
                <li>{{ stock.name }} ({{ stock.symbol }}): ${{ stock.price }}</li>
            {% endfor %}
        </ul>
    </body>
    </html>
    """
}

# Command to update stock prices
class Command(BaseCommand):
    help = 'Update stock prices'

    def handle(self, *args, **kwargs):
        api_key = 'YOUR_ALPHA_VANTAGE_API_KEY'
        for stock in Stock.objects.all():
            response = requests.get(f'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol={stock.symbol}&interval=1min&apikey={api_key}')
            data = response.json()
            stock.price = data['Time Series (1min)'][0]['4. close']
            stock.save()

# Run the server
if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', __name__)
    try:
        execute_from_command_line(sys.argv)
    except Exception as e:
        print(e)
