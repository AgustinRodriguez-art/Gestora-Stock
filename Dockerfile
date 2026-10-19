FROM php:8.2-apache

RUN a2dismod mpm_event mpm_worker || true; a2enmod mpm_prefork

RUN apt-get update \
    && apt-get install -y --no-install-recommends libcurl4-openssl-dev libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring curl \
    && rm -rf /var/lib/apt/lists/*

COPY . /var/www/html/

EXPOSE 8080

CMD ["bash", "-lc", "port=${PORT:-8080}; sed -ri \"s/^Listen 80$/Listen ${port}/\" /etc/apache2/ports.conf; sed -ri \"s/:80>/:${port}>/\" /etc/apache2/sites-available/000-default.conf; exec apache2-foreground"]