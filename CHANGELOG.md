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
