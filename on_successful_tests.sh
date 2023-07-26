#!/bin/bash
curl --location --request POST 'http://f102335e277c.eu.ngrok.io/service/m29vxew529yssyb9kzlm/api/v1/topics/set' --header 'Content-Type: application/json' --data-raw '{
	"topic": "sweet-home/18a23b2e-1/led/switch",
	"value": "true"
}'
