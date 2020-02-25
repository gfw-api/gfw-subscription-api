## 25/02/2020

- Fix issue where email queue listener would not start.
- Fix an issue where a redirect url would be incorrectly logged.

## 19/02/2020
- Add endpoint for finding subscriptions by id.
- Add endpoint for finding all subscriptions for a given user.
- Add possibility of creating, updating or deleting subscriptions that belong to other users when endpoints are called by other MSs.

## 17/02/2020

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
