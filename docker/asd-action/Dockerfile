FROM php:alpine

COPY --from=composer /usr/bin/composer /usr/bin/composer

RUN apk upgrade --no-cache \
 && apk add --no-cache graphviz ttf-linux-libertine \
 && fc-cache -f \
 && COMPOSER_ALLOW_SUPERUSER=1 composer require koriym/app-state-diagram

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
