## 01/03/2022

- Migrate to typescript
- Update nodejs to v16

# v.1.10.0

## 29/10/2021

- Make "See on map" and priority area URLs use planet basemaps by default.
- Add `env` multi-value filter support to GET subscriptions endpoint.

# v.1.9.0

## 29/06/2021

- Include new Help Center URLs in the payload sent to Sparkpost.
- Include custom map URLs by forest type in the payload sent to Sparkpost.

# v.1.8.4

## 28/06/2021

- Fix issue with `in_protected_area` column in VIIRS download CSV URL not returning boolean value.

# v.1.8.3

## 22/06/2021

- Include breakdown by forest type in email download CSV URLs.
- Upgrade NPM dependencies.

# v.1.8.2

## 14/06/2021

- Fix confidence category in VIIRS download URLs in subscription emails.
- Add support for hosts from `x-rw-domain` header when generating pagination links.

# v.1.8.1

## 07/06/2021

- Fix confidence category in VIIRS download URLs in subscription emails.
- Update `rw-api-microservice-node` to add CORS support.

# v.1.8.0

## 26/05/2021

- Use GFW Data API as the source to fetch subscription notification alerts [GFW-120](https://vizzuality.atlassian.net/browse/GFW-120)
- Add support for hosts from `referer` header when generating pagination links.
- Fix security vulnerabilities with `koa-validate` and `redis`.

# v.1.7.6

## 14/04/2021

- [GFW-91](https://vizzuality.atlassian.net/browse/GFW-91) Fix VIIRS "See on map" URL timeline parameters.

# v.1.7.5

## 03/03/2021

- [GFW-92](https://vizzuality.atlassian.net/browse/GFW-92) Fix dashboard URL to open in the correct tab.

# v.1.7.4

## 23/02/2021

- Remove dependency on CT's `authenticated` functionality
- Replace CT integration library
- [GFW-42](https://vizzuality.atlassian.net/browse/GFW-42) Update alert links to include both GLAD and VIIRS layers in monthly summary emails.

# v.1.7.3

## 09/12/2020

- Fix "See on map" URL for VIIRS Fires subscription emails

# v.1.7.2

## 26/10/2020

- Remove alert types that are no longer needed:
  - PRODES
  - Story
  - TerraI
  - Forma and Forma250GFW
  - Imazon

# v.1.7.1

## 12/10/2020

- Performance updates on the subscription email processes.
- Remove code for subscription statistics email.

# v.1.7.0

## 17/09/2020

- Add daily cronjob to validate subscription emails sent on that day - includes Slack notification with status at the end of the process.
- Update k8s files to version 1.16
- Update Jenkinsfile to enable 3-branch strategy.

# v.1.6.5

## 01/09/2020

- Revert fixes made on 1.6.3 on the download URLs in the payload data for GLAD and VIIRS email alerts.

# v.1.6.4

## 10/08/2020

- Apply formatting to subscription email values only if they are greater or equal than 1000.
- Fix handling of subscription parameters for legacy subscriptions

# v.1.6.3

## 07/08/2020

- Fix download URLs in the payload data for GLAD and VIIRS email alerts.

# v.1.6.2

## 22/07/2020

- Sanitize language of the subscription when providing an invalid language (supported languages are `en`, `fr`, `es`, `pt`, `zh` and `id`).

# v.1.6.1

## 15/07/2020

- Add possibility of ADMIN users finding subscriptions owned by other users by their ids.

# v.1.6.0

## 13/07/2020

- Create new presenter for monthly summary emails. [#172772321](https://www.pivotaltracker.com/story/show/172772321)
- Configure new cron for sending monthly summary emails on a monthly basis. [#172772438](https://www.pivotaltracker.com/story/show/172772438)
- Add `redirect=false` via query param to disable redirection in re-send confirmation endpoint.

# v.1.5.0

## 05/06/2020

- Add endpoint for testing subscription email alerts for GLAD alerts and VIIRS Fires. [#172772548](https://www.pivotaltracker.com/story/show/172772548)
- Update the datasets used by GLAD alert emails to the correct ones. [#173192978](https://www.pivotaltracker.com/story/show/173192978)
- Add cron schedule entry for GLAD alerts. [#173192978](https://www.pivotaltracker.com/story/show/173192978)

# v.1.4.2

## 19/05/2020

- Upgrade `mongoose` to v5.x
- Use secondary mongo nodes for read operations.
- Disable mongo unified topology.

# v.1.4.1

## 08/05/2020

- Rollback mongoose to 4.x and configure reads to prefer secondary mongodb servers


# v.1.4.0

## 23/04/2020

- Update the email parameters for GLAD alert emails.
- Added test coverage for GLAD alert email parameters.
- Fetching geostore id when we don't have one when sending GLAD alert emails, as in the cases of iso country, iso country + region, wdpaid and use + useid
- Update the download link to the correct one in the GLAD alert emails

# v1.3.1

## 08/04/2020

- Update k8s configuration with node affinity.

# v1.3.0

## 23/03/2020

- Update endpoint to find all subscriptions to use pagination.
- Add filter by updatedAtSince for the endpoint to find all subscriptions.

# v1.2.0

## 16/03/2020

- Add endpoint to find all subscriptions for all users - restricted to usage by other MSs.

# v1.1.0

## 28/02/2020

- Fix issue where email queue listener would not start.
- Fix an issue where a redirect url would be incorrectly logged.
- Add endpoint for finding subscriptions by id.
- Add endpoint for finding all subscriptions for a given user.
- Add possibility of creating, updating or deleting subscriptions that belong to other users when endpoints are called by other MSs.
- Add application field to statistics so that stats can be namespaced by application.

# v1.0.0

## 27/01/2020

- Add support for webhook-based subscription notifications.
- Use dataset's metadata name field on subscription emails, instead of dataset's name
- Add additional tests
- Add support for dataset overwrite using multiple files in parallel.
- Update node version to 12.
- Replace npm with yarn.
- Add liveliness and readiness probes.
- Add resource quota definition for kubernetes.
- Use dataset's metadata name field on subscription emails, instead of dataset's name
