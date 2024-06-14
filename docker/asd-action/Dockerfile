FROM php:alpine

COPY --from=composer /usr/bin/composer /usr/bin/composer

RUN apk upgrade --no-cache \
 && RUN COMPOSER_ALLOW_SUPERUSER=1 composer global config allow-plugins.bamarni/composer-bin-plugin true \
 && COMPOSER_ALLOW_SUPERUSER=1 composer require koriym/app-state-diagram

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
