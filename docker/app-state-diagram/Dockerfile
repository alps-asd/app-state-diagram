FROM php:latest

COPY --from=composer /usr/bin/composer /usr/bin/composer

RUN apt-get update \
 && apt-get -y --no-install-recommends install zip unzip \
 && apt-get -y --no-install-recommends install graphviz \
 && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
 && apt-get -y --no-install-recommends install nodejs \
 && rm -rf /var/lib/apt/lists/*

RUN COMPOSER_ALLOW_SUPERUSER=1 composer global require koriym/app-state-diagram \
 && npm --prefix $(composer global config home)/vendor/koriym/app-state-diagram/asd-sync install

WORKDIR /asd
