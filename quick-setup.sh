#!/bin/bash
IFS="=" read -ra db_name_arr <<< "$(grep DATABASE_NAME < .env | tr -d "'")"
db_name=${db_name_arr[1]};
IFS="=" read -ra db_user_arr <<< "$(grep DATABASE_USER < .env | tr -d "'")"
db_user=${db_user_arr[1]};
IFS="=" read -ra db_pass_arr <<< "$(grep DATABASE_PASSWORD < .env | tr -d "'")"
db_pass=${db_pass_arr[1]};

cp init-mongo-template.js init-mongo.js

sed -i "s;REF_USER;$db_user;g" init-mongo.js
sed -i "s;REF_PASS;$db_pass;g" init-mongo.js
sed -i "s;REF_DB;$db_name;g" init-mongo.js
