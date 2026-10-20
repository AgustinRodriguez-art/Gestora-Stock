FROM php:8.2-apache

# Deja activo únicamente el MPM que usa PHP con Apache.
RUN for mpm in mpm_event mpm_worker; do \
        a2dismod "$mpm" >/dev/null 2>&1 || true; \
    done \
    && a2enmod mpm_prefork \
    && apache2ctl -M | grep -q 'mpm_prefork_module'

RUN docker-php-ext-install pdo_mysql

ENV PORT=80

COPY . /var/www/html/

CMD ["bash", "-c", "PORT=\"${PORT:-80}\"; sed -i \"s/^Listen 80$/Listen ${PORT}/\" /etc/apache2/ports.conf && sed -i \"s/<VirtualHost \\\\*:80>/<VirtualHost *:${PORT}>/\" /etc/apache2/sites-available/000-default.conf && exec apache2-foreground"]