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
