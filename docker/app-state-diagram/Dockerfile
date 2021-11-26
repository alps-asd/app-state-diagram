FROM php:alpine

COPY --from=composer /usr/bin/composer /usr/bin/composer

RUN apk --no-cache upgrade \
 && apk --no-cache add ttf-linux-libertine \
 && fc-cache -f \
 && apk --no-cache add graphviz nodejs npm

RUN COMPOSER_ALLOW_SUPERUSER=1 composer global require koriym/app-state-diagram \
 && npm --prefix $(composer global config home)/vendor/koriym/app-state-diagram/asd-sync install

WORKDIR /asd
