#!/bin/bash
IFS="=" read -a db_name_arr <<< $(cat .env | grep DATABASE_NAME | tr -d "'")
db_name=${db_name_arr[1]};
IFS="=" read -a db_user_arr <<< $(cat .env | grep DATABASE_USER | tr -d "'")
db_user=${db_user_arr[1]};
IFS="=" read -a db_pass_arr <<< $(cat .env | grep DATABASE_PASSWORD | tr -d "'")
db_pass=${db_pass_arr[1]};

cp init-mongo-template.js init-mongo.js

sed -i "s;REF_USER;$db_user;g" init-mongo.js
sed -i "s;REF_PASS;$db_pass;g" init-mongo.js
sed -i "s;REF_DB;$db_name;g" init-mongo.js
