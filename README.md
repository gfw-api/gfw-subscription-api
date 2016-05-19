# Global Forest Watch Subscription API

Master: [![Build Status](https://travis-ci.org/gfw-api/gfw-subscription-api.svg?branch=master)](https://travis-ci.org/gfw-api/gfw-subscription-api)
Develop: [![Build Status](https://travis-ci.org/gfw-api/gfw-subscription-api.svg?branch=develop)](https://travis-ci.org/gfw-api/gfw-subscription-api)

This repository contains the microservice that handles subscriptions to
forest change layers.

[View the documentation for this
API](http://gfw-api.github.io/swagger-ui/?url=https://raw.githubusercontent.com/gfw-api/gfw-subscription-api/master/app/microservice/swagger.yml#/Subscription)

1. [Getting Started](#getting-started)
2. [Deployment](#deployment)

## Getting Started

### OS X

**First, make sure that you have the [API gateway running
locally](https://github.com/Vizzuality/api-gateway/tree/master#getting-started).**

We're using Docker which, luckily for you, means that getting the
application running locally should be fairly painless. First, make sure
that you have [Docker Compose](https://docs.docker.com/compose/install/)
installed on your machine.

If you've not used Docker before, you may need to set up some defaults:

```
docker-machine create --driver virtualbox default
docker-machine start default
eval $(docker-machine env default)
```

Now we're ready to actually get the application running:

```
git clone https://github.com/Vizzuality/gfw-subscription-api.git
cd gfw-subscription-api
npm install
npm run develop
```

You can now access the microservice through the API gateway.

## Deployment

The application is deployed to Heroku. Setup Heroku for the repository:

```
heroku git:remote -a gfw-subscription-api-staging -r staging
```

And deploy as normal:

```
git push staging master
```

### Configuration

It is necessary to define these environment variables:

* API_GATEWAY_URI => Gateway Service API URL
* NODE_ENV => Environment (prod, staging, dev)
* API_GATEWAY_QUEUE_URL => Url of async queue
* API_GATEWAY_QUEUE_PROVIDER => redis (only support redis)
* SELF_REGISTRY => on/off to set auto registry in API Gateway
