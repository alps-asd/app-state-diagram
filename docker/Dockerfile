FROM php:latest

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN apt-get update \
 && apt-get -y --no-install-recommends install zip unzip \
 && apt-get -y --no-install-recommends install graphviz \
 && curl -sL https://deb.nodesource.com/setup_10.x | bash - \
 && apt-get -y --no-install-recommends install nodejs npm

RUN COMPOSER_ALLOW_SUPERUSER=1 composer global require koriym/app-state-diagram

WORKDIR /asd
