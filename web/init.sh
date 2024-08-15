#!/bin/sh
while [[ "" != "$SSL_KEY" ]];do
    while [[ ! -e "$SSL_KEY" ]];do
        echo "No SSL key found, generating pair"
        openssl req -subj "/CN=$DOMAIN/O=OpenSMM/C=US" -new -newkey rsa:2048 -sha256 -days 365 -nodes -x509 -keyout "$SSL_KEY" -out "$SSL_CRT"
        break;
    done
    break;
done

# trust cert to avoid curl errors
echo "Updating certificate store"
cp "$SSL_CRT" /usr/local/share/ca-certificates/
update-ca-certificates
