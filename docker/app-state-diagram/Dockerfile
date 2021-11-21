FROM php:latest

COPY --from=composer /usr/bin/composer /usr/bin/composer

ENV COMPOSER_HOME="/root/.composer"

RUN apt-get update \
 && apt-get -y --no-install-recommends install zip unzip \
 && apt-get -y --no-install-recommends install graphviz \
 && curl -sL https://deb.nodesource.com/setup_10.x | bash - \
 && apt-get -y --no-install-recommends install nodejs npm \
 && COMPOSER_ALLOW_SUPERUSER=1 composer global require koriym/app-state-diagram \
 && npm --prefix ${COMPOSER_HOME}/vendor/koriym/app-state-diagram/asd-sync install

WORKDIR /asd
