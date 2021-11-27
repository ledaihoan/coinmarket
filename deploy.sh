#!/usr/bin/env bash
USER=root
SERVER=ledaihoan.com
DEPLOY_PATH=/data/services/coinmarket
npm install
npm run build
rsync -auvr --delete ./dist ${USER}@${SERVER}:${DEPLOY_PATH}
rsync -auvr --delete ./runservice.sh ${USER}@${SERVER}:${DEPLOY_PATH}
rsync -auvr --delete ./package.json ${USER}@${SERVER}:${DEPLOY_PATH}
rsync -auvr --delete ./.env ${USER}@${SERVER}:${DEPLOY_PATH}
rsync -auvr --delete ./public ${USER}@${SERVER}:${DEPLOY_PATH}
rsync -auvr --delete ./views ${USER}@${SERVER}:${DEPLOY_PATH}