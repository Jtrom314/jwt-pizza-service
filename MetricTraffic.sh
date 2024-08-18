#!/bin/bash

host="https://pizza-service.hexcodes.net"
chaos="false"

echo "running"

while getopts "lc" opt; do
  case $opt in
    l)
      host="http://localhost:3000"
      ;;
    c)
      chaos="true"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

function login_auth_chaos() {
  response=$(curl -s -X PUT $host/api/auth -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json')
  token=$(echo $response | jq -r '.token')
  echo $response
  curl -s -X PUT "$host/api/auth/chaos/$chaos" -H "Authorization: Bearer $token"

  curl -s -X DELETE "$host/api/auth" -H "Authorization: Bearer $token"
}

function get_menu() {
  while true; do
    curl -s "$host/api/order/menu"
    sleep 3
  done
}

function bad_auth() {
  while true; do
    curl -s -X PUT "$host/api/auth" -d '{"email":"unknown@jwt.com", "password":"bad"}' -H 'Content-Type: application/json'
    sleep 25
  done
}

function good_auth() {
  while true; do
    res=$(curl -s -X POST "$host/api/auth" -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json')
    tok=$(echo $res | jq -r '.token')

    if [ "$tok" != "null" ]; then
      sleep 10
      curl -s -X DELETE "$host/api/auth" -H "Authorization: Bearer $tok"
    fi
  
    sleep 10
  done
}

function authenticated_order() {
  while true; do
    response=$(curl -s -X PUT "$host/api/auth" -d '{"email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json')
    token=$(echo $response | jq -r '.token')

    if [ "$token" != "null" ]; then
      curl -s -X POST "$host/api/order" -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId": 1, "items": [{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}' -H "Authorization: Bearer $token"
      sleep 5
      curl -s -X DELETE "$host/api/auth" -H "Authorization: Bearer $token"
    fi

    sleep 5
  done
}

# Trigger login_auth_chaos once
# login_auth_chaos
# sleep 5
# Handle script interruption to clean up background processes
trap "kill 0" EXIT

# get_menu &
# bad_auth &
authenticated_order
# good_auth &

wait
