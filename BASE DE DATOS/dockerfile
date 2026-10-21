FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql

ENV PORT=80

COPY . /var/www/html/

CMD ["bash", "-c", "rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf && a2enmod mpm_prefork >/dev/null && PORT=\"${PORT:-80}\" && sed -i \"s/^Listen 80$/Listen ${PORT}/\" /etc/apache2/ports.conf && sed -i \"s/<VirtualHost \\\\*:80>/<VirtualHost *:${PORT}>/\" /etc/apache2/sites-available/000-default.conf && apache2ctl -M && exec apache2-foreground"]